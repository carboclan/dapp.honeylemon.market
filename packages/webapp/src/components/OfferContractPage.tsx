import React, { useState, useEffect } from "react";
import {
  Button,
  Typography,
  Grid,
  makeStyles,
  FilledInput,
  Link,
  InputAdornment,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  IconButton
} from "@material-ui/core";
import clsx from "clsx";
import { BigNumber } from "@0x/utils";
import { useHoneylemon, TokenType } from "../contexts/HoneylemonContext";
import { useOnboard } from "../contexts/OnboardContext";
import { forwardTo } from "../helpers/history";
import ContractSpecificationModal from "./ContractSpecificationModal";
import OrderbookModal from "./OrderbookModal";
import MRIDisplay from "./MRIDisplay";
import { Info, OpenInNew, ExpandMore } from "@material-ui/icons";
import MRIInformationModal from "./MRIInformationModal";
import dayjs from "dayjs";
import AboutHoneylemonContractModal from "./AboutHoneylemonContractModal";
import * as Sentry from "@sentry/react";
import { t, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";

const useStyles = makeStyles(({ spacing, palette, transitions }) => ({
  rightAlign: {
    textAlign: "end"
  },
  inputBase: {
    textAlign: "end",
    padding: spacing(1)
  },
  offerSummary: {
    padding: spacing(2),
    width: "100%"
  },
  offerSummaryBlur: {
    filter: "blur(2px)"
  },
  loadingSpinner: {
    width: 20,
    flexBasis: "end",
    flexGrow: 0,
    color: palette.primary.main
  },
  errorList: {
    color: palette.primary.main
  },
  button: {
    marginTop: spacing(1),
    marginRight: spacing(1)
  },
  skipButton: {
    backgroundColor: palette.warning.main
  },
  actionsContainer: {
    marginBottom: spacing(2)
  },
  expand: {
    transform: "rotate(0deg)",
    marginLeft: "auto",
    transition: transitions.create("transform", {
      duration: transitions.duration.shortest
    })
  },
  expandOpen: {
    transform: "rotate(180deg)"
  },
  viewOfferButton: {
    borderColor: palette.primary.main,
    borderWidth: 2,
    borderStyle: "solid",
    color: palette.primary.main,
    backgroundColor: "#303030",
    "&:hover": {
      backgroundColor: "#505050"
    }
  },
  offerSummaryEstimate: {
    color: palette.primary.main
  },
  subtotal: {
    borderTop: "1.5px solid",
    borderTopColor: palette.common.white
  }
}));

const OfferContractPage: React.SFC = () => {
  const { i18n } = useLingui();
  const {
    honeylemonService,
    COLLATERAL_TOKEN_DECIMALS,
    COLLATERAL_TOKEN_NAME,
    CONTRACT_COLLATERAL_RATIO,
    collateralTokenAllowance,
    collateralTokenBalance,
    CONTRACT_DURATION,
    isDsProxyDeployed,
    PAYMENT_TOKEN_NAME,
    marketData,
    btcStats,
    PAYMENT_TOKEN_DECIMALS,
    deployDSProxyContract,
    approveToken,
    setShowTokenInfoModal
  } = useHoneylemon();
  const { address = "0x" } = useOnboard();
  const classes = useStyles();

  const [hashPrice, setHashPrice] = useState(0);
  const [hashAmount, setHashAmount] = useState<number | undefined>(0);
  const [totalContractPrice, setTotalContractPrice] = useState(0);
  const [collateralAmount, setCollateralAmount] = useState(0);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [
    showAboutHoneylemonContractModal,
    setShowAboutHoneylemonContractModal
  ] = useState(false);
  const [txActive, setTxActive] = useState(false);
  const [showContractSpecificationModal, setShowContractSpecificationModal] = useState(
    false
  );
  const [showOfferDetails, setShowOfferDetails] = useState(false);
  const [showOrderbook, setShowOrderbook] = useState(false);
  const [showMRIInformationModal, setShowMRIInformationModal] = useState(false);
  const [skipDsProxy, setSkipDsProxy] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Set default quantity and price
  useEffect(() => {
    const setDefaultValues = async () => {
      const maxQuanityCollateralized = Math.floor(
        collateralTokenBalance /
          CONTRACT_COLLATERAL_RATIO /
          marketData.currentMRI /
          CONTRACT_DURATION
      );
      const startingQuantity = Math.min(1000, maxQuanityCollateralized);
      setHashAmount(startingQuantity);

      const mriPrice = Number(
        (marketData.currentMRI * marketData.currentBTCSpotPrice).toLocaleString(
          undefined,
          {
            maximumFractionDigits: PAYMENT_TOKEN_DECIMALS
          }
        )
      );

      const quote = await honeylemonService?.getQuoteForSize(
        new BigNumber(startingQuantity)
      );

      const startingPrice =
        Number(quote?.remainingMakerFillAmount?.toString() || -1) === 0
          ? Number(
              quote?.price
                .dividedBy(CONTRACT_DURATION)
                .decimalPlaces(PAYMENT_TOKEN_DECIMALS)
                .toString()
            )
          : mriPrice;

      setHashPrice(startingPrice);
    };

    setDefaultValues();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const getCollateralForContract = async () => {
      if (!honeylemonService) return;
      try {
        const result = await honeylemonService.getCollateralForContract(hashAmount);
        if (!cancelled) {
          setCollateralAmount(
            Number(
              new BigNumber(result || 0).shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString()
            )
          );
        }
      } catch (error) {
        console.log("Something went wrong fetching required collateral amount");
        console.log(error);
        Sentry.captureException(error);
      }
    };
    hashAmount && getCollateralForContract();
    return () => {
      cancelled = true;
    };
  }, [hashAmount, honeylemonService, COLLATERAL_TOKEN_DECIMALS]);

  useEffect(() => {
    hashAmount && setTotalContractPrice(hashPrice * hashAmount * CONTRACT_DURATION);
  }, [hashPrice, hashAmount, CONTRACT_DURATION]);

  const tokenApprovalGranted = collateralTokenAllowance > collateralAmount;
  const sufficientCollateral = collateralTokenBalance >= collateralAmount;

  const errors = [];
  !sufficientCollateral &&
    errors.push(
      i18n._(
        t`You need at least ${collateralAmount.toLocaleString(undefined, {
          maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS
        })} ${COLLATERAL_TOKEN_NAME} to proceed. Open Side Menu (top-right) to manage your wallet balance and get more.`
      )
    );

  const handleCloseOfferDialog = () => {
    setErrorMessage("");
    setShowOfferModal(false);
  };

  const handleDeployDSProxy = async () => {
    setTxActive(true);
    setErrorMessage("");
    try {
      await deployDSProxyContract();
    } catch (error) {
      Sentry.captureException(error);
      setErrorMessage(error.message);
    }
    setTxActive(false);
  };

  const handleApproveCollateralToken = async () => {
    setTxActive(true);
    setErrorMessage("");
    try {
      await approveToken(TokenType.CollateralToken);
    } catch (error) {
      Sentry.captureException(error);
      setErrorMessage(error.toString());
    }
    setTxActive(false);
  };

  const handleCreateOffer = async () => {
    setTxActive(true);
    setErrorMessage("");
    if (!honeylemonService) return;
    if (hashAmount) {
      try {
        const order = honeylemonService.createOrder(
          address,
          new BigNumber(hashAmount),
          new BigNumber(CONTRACT_DURATION).multipliedBy(hashPrice),
          new BigNumber(Math.round(Date.now() / 1000) + 10 * 24 * 60 * 60)
        );

        const signedOrder = await honeylemonService.signOrder(order);
        await honeylemonService.submitOrder(signedOrder);
        setShowOfferModal(false);
        forwardTo("/portfolio");
      } catch (error) {
        console.log("Something went wrong creating the offer");
        console.log(error);
        Sentry.captureException(error);
        setErrorMessage("There was an error creating the offer. Please try again later.");
      }
    }
    setTxActive(false);
  };

  const handleSkipDsProxy = () => {
    setSkipDsProxy(true);
  };

  const getActiveStep = () => {
    if (!skipDsProxy && !isDsProxyDeployed) return 0;
    if (!tokenApprovalGranted) return 1;
    return 2;
  };

  useEffect(() => {
    const step = getActiveStep();
    setActiveStep(step);
  }, [skipDsProxy, isDsProxyDeployed, tokenApprovalGranted]);

  const steps = [
    i18n._(t`Honeylemon Vault  (Optional)`),
    i18n._(t`Approve ${COLLATERAL_TOKEN_NAME} for Collateral`),
    i18n._(t`Offer Contract`)
  ];

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return i18n._(
          t`If you place multiple orders or use it more than once, create Honeylemon Vault will deploy a DSProxy contract for your wallet, which reduces future gas fee and streamline your transactions. Additional Ethereum gas fee applies.`
        );
      case 1:
        return i18n._(
          t`You are granting permission for Honeylemon smart contracts to access ${COLLATERAL_TOKEN_NAME} in your wallet, enabling actual collateral to be auto-deposited upon offer being taken. You can turn OFF permission in Side Menu (top-right) - Manage Your Wallet. Additional Ethereum gas fee applies.`
        );
      case 2:
        return i18n._(
          t`You are offering ${hashAmount?.toLocaleString()} TH of ${CONTRACT_DURATION}-Day BTC Mining Revenue Contract at a limit price of ${hashPrice.toLocaleString(
            undefined,
            { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS }
          )}/TH/Day. Your offer will be valid for 10 days and can be canceled (for free) anytime in Portfolio. Additional Ethereum gas fee applies.`
        );
    }
  };

  const getStepButtonLabel = (step: number) => {
    switch (step) {
      case 0:
        return i18n._(t`Create`);
      case 1:
        return i18n._(t`Approve`);
      case 2:
        return i18n._(t`Offer`);
    }
  };

  const handleStepperNext = (step: number) => {
    switch (step) {
      case 0:
        return handleDeployDSProxy();
      case 1:
        return handleApproveCollateralToken();
      case 2:
        return handleCreateOffer();
    }
  };

  const handleStartOffer = () => {
    setSkipDsProxy(false);
    setShowOfferModal(true);
    // activeStep === 2 && handleCreateOffer();
  };

  const handleOfferDetailsClick = () => {
    setShowOfferDetails(!showOfferDetails);
  };

  const premiumOverMRI =
    ((hashPrice - marketData.currentMRI * marketData.currentBTCSpotPrice) /
      (marketData.currentMRI * marketData.currentBTCSpotPrice)) *
    100;

  return (
    <>
      <Grid container alignItems="center" justify="flex-start" spacing={2}>
        <Grid item xs={12}>
          <MRIDisplay />
        </Grid>
        <Grid item xs={8}>
          <Typography style={{ fontWeight: "bold" }}>
            <Trans>Offer a {CONTRACT_DURATION}-day Mining Revenue Contract</Trans>
            <Info
              fontSize="small"
              onClick={() => {
                setShowAboutHoneylemonContractModal(true);
              }}
            />
          </Typography>
        </Grid>
        <Grid item xs={4} style={{ textAlign: "end" }}>
          <Button
            onClick={() => setShowOrderbook(true)}
            className={classes.viewOfferButton}
            variant="contained"
          >
            <Trans>View Offers</Trans>
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Typography style={{ fontWeight: "bold" }}>
            <Trans>Price:</Trans>
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <FilledInput
            fullWidth
            disableUnderline
            inputProps={{
              className: classes.inputBase,
              min: 0,
              step: 0.000001
            }}
            placeholder="0"
            startAdornment={<InputAdornment position="start">$</InputAdornment>}
            onChange={e => {
              const newValueString = e.target.value;
              if (!newValueString) {
                setHashPrice(0);
                setTotalContractPrice(0);
                return;
              }
              const newValue = parseFloat(newValueString);
              !isNaN(newValue) && setHashPrice(newValue);
            }}
            value={hashPrice || ""}
            type="number"
            onBlur={e => {
              e.target.value = e.target.value.replace(/^(-)?0+(0\.|\d)/, "$1$2");
            }}
            disabled={showOfferModal}
          />
        </Grid>
        <Grid item xs={4} className={classes.rightAlign}>
          <Typography style={{ fontWeight: "bold" }} color="primary">
            /TH/Day
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography style={{ fontWeight: "bold" }}>
            <Trans>Quantity</Trans>
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <FilledInput
            fullWidth
            disableUnderline
            inputProps={{
              className: classes.inputBase,
              min: 0,
              step: 1
            }}
            placeholder="0"
            onChange={e => {
              const newValueString = e.target.value;
              if (!newValueString) {
                setHashAmount(0);
                return;
              }
              const newValue = parseInt(newValueString);
              !isNaN(newValue) && setHashAmount(newValue);
            }}
            value={hashAmount || ""}
            type="number"
            onBlur={e => {
              e.target.value = e.target.value.replace(/^(-)?0+(0\.|\d)/, "$1$2");
            }}
            disabled={showOfferModal}
          />
        </Grid>
        <Grid item xs={4} className={classes.rightAlign}>
          <Typography style={{ fontWeight: "bold" }} color="primary">
            TH
          </Typography>
        </Grid>
        <Grid item xs={12} style={{ paddingTop: 4 }}>
          <Typography variant="caption">
            <Trans>
              Enter your limit order. Make sure sufficient {COLLATERAL_TOKEN_NAME} (for
              collateral) & ETH (for Ethereum gas fees) is in your wallet.
            </Trans>
          </Typography>
        </Grid>
        {errors.length > 0 && (
          <Grid item xs={12}>
            {errors.map((error: string, i) => (
              <Typography
                key={i}
                variant="caption"
                paragraph
                color="secondary"
                onClick={() =>
                  error.includes("enough") ? setShowTokenInfoModal(true) : null
                }
              >
                {error}
              </Typography>
            ))}
          </Grid>
        )}
        <Grid item xs={12} container>
          <Paper
            className={clsx(classes.offerSummary, {
              [classes.offerSummaryBlur]: !sufficientCollateral
            })}
          >
            <Grid item container xs={12}>
              <Grid item xs={6}>
                <Typography align="left">
                  <strong>
                    <Trans>Offer Summary</Trans>
                  </strong>
                </Typography>
              </Grid>
              <Grid item xs={6} style={{ textAlign: "right" }}>
                <Typography variant="caption">
                  <Link
                    href="#"
                    onClick={() => setShowContractSpecificationModal(true)}
                    color="textPrimary"
                  >
                    <Trans>Contract Specs</Trans> <Info fontSize="small" />
                  </Link>
                </Typography>
              </Grid>
            </Grid>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Your Price</TableCell>
                  <TableCell align="right">
                    $
                    {hashPrice.toLocaleString(undefined, {
                      maximumFractionDigits: PAYMENT_TOKEN_DECIMALS
                    })}
                    /Th/Day
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Trans>Your Quantity</Trans>
                    <br />
                  </TableCell>
                  <TableCell align="right">
                    {hashAmount?.toLocaleString()} TH <br />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Trans>Contract Duration</Trans>
                    <br />
                  </TableCell>
                  <TableCell align="right">
                    {CONTRACT_DURATION} <Trans>Days</Trans>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    className={clsx(classes.offerSummaryEstimate, classes.subtotal)}
                  >
                    <Trans>Contract Total</Trans>
                  </TableCell>
                  <TableCell
                    align="right"
                    className={clsx(classes.offerSummaryEstimate, classes.subtotal)}
                  >
                    {`${totalContractPrice.toLocaleString(undefined, {
                      maximumFractionDigits: PAYMENT_TOKEN_DECIMALS - 2
                    })} ${PAYMENT_TOKEN_NAME}`}
                    <br />
                  </TableCell>
                </TableRow>
                {totalContractPrice && totalContractPrice < 100 ? (
                  <TableRow>
                    <TableCell colSpan={2}>
                      <Typography variant="caption" color="secondary">
                        <Trans>
                          Suggest to increase your contract total to above 100{" "}
                          {PAYMENT_TOKEN_NAME} due to recent high fees in ethereum
                          network. See{" "}
                          <Link
                            href="https://docs.honeylemon.market/fees"
                            target="_blank"
                            rel="noopener"
                            color="secondary"
                          >
                            fees for details.
                            <OpenInNew fontSize="small" />
                          </Link>
                        </Trans>
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
                <TableRow>
                  <TableCell className={classes.offerSummaryEstimate}>
                    <Trans>Estimated Collateral (125%)</Trans>
                  </TableCell>
                  <TableCell align="right" className={classes.offerSummaryEstimate}>
                    {`${collateralAmount.toLocaleString(undefined, {
                      maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS
                    })} ${COLLATERAL_TOKEN_NAME}`}{" "}
                    <br />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className={classes.offerSummaryEstimate}>
                    <Trans>Price vs. MRI_BTC</Trans>
                  </TableCell>
                  <TableCell align="right" className={classes.offerSummaryEstimate}>
                    {`${Math.abs(premiumOverMRI).toLocaleString(undefined, {
                      maximumFractionDigits: 2
                    })}% ${premiumOverMRI >= 0 ? "Premium" : "Discount"}`}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2}>
                    <Typography variant="caption">{`* Your price is ${Math.abs(
                      premiumOverMRI
                    ).toLocaleString(undefined, { maximumFractionDigits: 2 })}% ${
                      premiumOverMRI >= 0 ? "higher" : "lower"
                    } than the network daily average mining revenue.`}</Typography>
                  </TableCell>
                </TableRow>
                {!showOfferDetails ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      align="center"
                      onClick={handleOfferDetailsClick}
                      style={{ cursor: "pointer" }}
                    >
                      <Trans>Find Out More</Trans>
                      <IconButton className={classes.expand} aria-label="show more">
                        <ExpandMore />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    <TableRow>
                      <TableCell>
                        <Trans>Start</Trans>
                      </TableCell>
                      <TableCell align="right">
                        <Trans>Order-fill Date UTC 00:01</Trans>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Trans>Expiration</Trans>
                      </TableCell>
                      <TableCell align="right">
                        {CONTRACT_DURATION} <Trans>Days After Start</Trans>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Trans>Settlement</Trans>
                      </TableCell>
                      <TableCell align="right">
                        <Trans>24 Hours After Exp</Trans>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Trans>Offer Valid Till</Trans>
                      </TableCell>
                      <TableCell align="right">{`${dayjs()
                        .add(10, "d")
                        .format("DD-MMM-YY")}`}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2} style={{ color: "#a9a9a9" }}>
                        <Typography variant="subtitle1" style={{ paddingTop: 4 }}>
                          <Trans>WHAT DOES IT MEAN?</Trans>
                        </Typography>{" "}
                        <br />
                        <Typography variant="body2" paragraph>
                          <Trans>
                            You are offering <strong>{hashAmount} TH</strong> of{" "}
                            {CONTRACT_DURATION}-Day Mining Revenue Contract at{" "}
                            <strong>
                              {PAYMENT_TOKEN_NAME}{" "}
                              {hashPrice.toLocaleString(undefined, {
                                maximumFractionDigits: PAYMENT_TOKEN_DECIMALS
                              })}
                              /TH/Day
                            </strong>
                            .
                          </Trans>
                        </Typography>
                        <Typography variant="body2" paragraph>
                          <Trans>
                            You need to have at least{" "}
                            <strong>
                              {collateralAmount.toLocaleString(undefined, {
                                maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS
                              })}{" "}
                              {COLLATERAL_TOKEN_NAME}
                            </strong>{" "}
                            in your wallet balance now, and approve Honeylemon smart
                            contract to access your {COLLATERAL_TOKEN_NAME} in your wallet
                            as collateral to list your offer. You may cancel your offer
                            from your Portfolio anytime prior to it being filled. As soon
                            as your order is filled, your approved collateral will be
                            automatically deposited, you will receive payment in{" "}
                            {PAYMENT_TOKEN_NAME} immediately and the contract will start.
                          </Trans>
                        </Typography>
                        <Typography variant="body2" paragraph>
                          <Trans>
                            At the end of <strong>{CONTRACT_DURATION} days</strong> your
                            counterparty will receive the network average BTC block reward
                            & transaction fees per TH based on the average value of the{" "}
                            <Link
                              href="#"
                              onClick={() => setShowMRIInformationModal(true)}
                            >
                              Bitcoin Mining Revenue Index (MRI_BTC){" "}
                              <Info fontSize="small" />
                            </Link>{" "}
                            over {CONTRACT_DURATION} days up to a{" "}
                            <strong>max capped by your collateral</strong>.
                          </Trans>
                        </Typography>
                        <Typography variant="body2" paragraph>
                          <Trans>
                            The payoff will be directly deducted from your collateral, and
                            you can withdraw the remainder of your collateral after
                            settlement.
                          </Trans>
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        align="center"
                        onClick={handleOfferDetailsClick}
                        style={{ cursor: "pointer" }}
                      >
                        <Trans>Show Less</Trans>
                        <IconButton className={clsx(classes.expand, classes.expandOpen)}>
                          <ExpandMore />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleStartOffer}
            disabled={hashAmount === 0 || !sufficientCollateral || showOfferModal}
          >
            <Trans>OFFER LIMIT ORDER</Trans>{" "}
            {showOfferModal && (
              <CircularProgress className={classes.loadingSpinner} size={20} />
            )}
          </Button>
        </Grid>
      </Grid>
      <AboutHoneylemonContractModal
        open={showAboutHoneylemonContractModal}
        onClose={() => setShowAboutHoneylemonContractModal(false)}
      />
      <Dialog
        open={showOfferModal}
        onClose={handleCloseOfferDialog}
        aria-labelledby="form-dialog-title"
        disableBackdropClick
        disableEscapeKeyDown
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="form-dialog-title">
          <Trans>Create Offer</Trans>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  <Typography paragraph>{getStepContent(index)}</Typography>
                  {errorMessage && <Typography color="error">{errorMessage}</Typography>}
                  <div className={classes.actionsContainer}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleStepperNext(activeStep)}
                      className={classes.button}
                      disabled={txActive}
                    >
                      {getStepButtonLabel(activeStep)}{" "}
                      {txActive && (
                        <CircularProgress className={classes.loadingSpinner} size={20} />
                      )}
                    </Button>
                    {activeStep === 0 ? (
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={handleSkipDsProxy}
                        className={classes.button}
                        disabled={txActive}
                      >
                        <Trans>Skip</Trans>
                      </Button>
                    ) : (
                      <Button
                        onClick={handleCloseOfferDialog}
                        className={classes.button}
                        disabled={txActive}
                      >
                        <Trans>Cancel</Trans>
                      </Button>
                    )}
                  </div>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
      </Dialog>
      <ContractSpecificationModal
        open={showContractSpecificationModal}
        onClose={() => setShowContractSpecificationModal(false)}
      />
      <OrderbookModal open={showOrderbook} onClose={() => setShowOrderbook(false)} />
      <MRIInformationModal
        open={showMRIInformationModal}
        onClose={() => setShowMRIInformationModal(false)}
      />
    </>
  );
};

export default OfferContractPage;
