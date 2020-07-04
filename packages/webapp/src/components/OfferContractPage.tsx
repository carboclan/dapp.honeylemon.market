import React, { useState, useEffect } from 'react';
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
  List,
  ListItem,
  ListItemText,
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
  IconButton,
} from '@material-ui/core';
import clsx from 'clsx';
import { BigNumber } from '@0x/utils';
import { useHoneylemon, TokenType } from '../contexts/HoneylemonContext';
import { useOnboard } from '../contexts/OnboardContext';
import { forwardTo } from '../helpers/history';
import ContractSpecificationModal from './ContractSpecificationModal';
import OrderbookModal from './OrderbookModal';
import MRIDisplay from './MRIDisplay';
import { Info, OpenInNew, ExpandMore } from '@material-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import MRIInformationModal from './MRIInformationModal';
import dayjs from 'dayjs';

const useStyles = makeStyles(({ spacing, palette, transitions }) => ({
  rightAlign: {
    textAlign: 'end',
  },
  inputBase: {
    textAlign: 'end',
    padding: spacing(1)
  },
  offerSummary: {
    padding: spacing(2),
    width: '100%'
  },
  offerSummaryBlur: {
    filter: 'blur(2px)',
  },
  loadingSpinner: {
    width: 20,
    flexBasis: 'end',
    flexGrow: 0,
    color: palette.primary.main,
  },
  errorList: {
    color: palette.primary.main,
  },
  button: {
    marginTop: spacing(1),
    marginRight: spacing(1),
  },
  skipButton: {
    backgroundColor: palette.warning.main
  },
  actionsContainer: {
    marginBottom: spacing(2),
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: transitions.create('transform', {
      duration: transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
  viewOfferButton: {
    borderColor: palette.primary.main,
    borderWidth: 2,
    borderStyle: 'solid',
    color: palette.primary.main,
    backgroundColor: '#303030',
    '&:hover': {
      backgroundColor: '#505050',
    },
  }
}))

const OfferContractPage: React.SFC = () => {
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
  } = useHoneylemon();
  const { address = '0x' } = useOnboard();
  const classes = useStyles();

  const [hashPrice, setHashPrice] = useState(
    Number(
      (btcStats.mri * marketData.currentBTCSpotPrice)
        .toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })));
  const [hashAmount, setHashAmount] = useState<number | undefined>(0);
  const [totalContractPrice, setTotalContractPrice] = useState(0);
  const [collateralAmount, setCollateralAmount] = useState(0);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [txActive, setTxActive] = useState(false);
  const [showContractSpecificationModal, setShowContractSpecificationModal] = useState(false);
  const [showOfferDetails, setShowOfferDetails] = useState(false);
  const [showOrderbook, setShowOrderbook] = useState(false);
  const [showMRIInformationModal, setShowMRIInformationModal] = useState(false);
  const [skipDsProxy, setSkipDsProxy] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Set default quantity
  useEffect(() => {
    const maxQuanityCollateralized = collateralTokenBalance / CONTRACT_COLLATERAL_RATIO / marketData.currentMRI
    const startingQuantity = Math.min(1000, maxQuanityCollateralized);
    setHashAmount(startingQuantity);
  }, [])

  useEffect(() => {
    let cancelled = false;
    const getCollateralForContract = async () => {
      try {
        const result = await honeylemonService.getCollateralForContract(hashAmount)
        if (!cancelled) {
          setCollateralAmount(Number(new BigNumber(result || 0).shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString()));
        }
      } catch (error) {
        console.log('Something went wrong fetching required collateral amount')
        console.log(error);
      }
    };
    hashAmount && getCollateralForContract();
    return () => { cancelled = true }
  }, [hashAmount, honeylemonService, COLLATERAL_TOKEN_DECIMALS]);

  useEffect(() => {
    hashAmount &&
      setTotalContractPrice(hashPrice * hashAmount * CONTRACT_DURATION)
  }, [hashPrice, hashAmount, CONTRACT_DURATION])

  const tokenApprovalGranted = collateralTokenAllowance > collateralAmount;
  const sufficientCollateral = collateralTokenBalance >= collateralAmount;

  const errors = [];
  !sufficientCollateral && errors.push(`You do not have enough ${COLLATERAL_TOKEN_NAME} to proceed`);
  totalContractPrice && totalContractPrice < 100 && errors.push('Suggest to increase your contract total to above 100 USDT due to recent high fees in ethereum network. See Fees for details.')

  const handleCloseOfferDialog = () => {
    setErrorMessage('');
    setShowOfferModal(false);
  }

  const handleDeployDSProxy = async () => {
    setErrorMessage('');
    try {
      await deployDSProxyContract();
    } catch (error) {
      setErrorMessage('There was an error deploying the honeylemon vault. Please try again.');
    }
    setTxActive(false);
  }

  const handleApproveCollateralToken = async () => {
    setTxActive(true);
    setErrorMessage('');
    try {
      await approveToken(TokenType.CollateralToken)
    } catch (error) {
      setErrorMessage(error.toString())
    }
    setTxActive(false);
  }

  const handleCreateOffer = async () => {
    setTxActive(true);
    setErrorMessage('')
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
        setShowOfferModal(false)
        forwardTo('/portfolio')
      } catch (error) {
        console.log('Something went wrong creating the offer');
        console.log(error);
        setErrorMessage('There was an error creating the offer. Please try again later.')
      }
    }
    setTxActive(false);
  }

  const handleSkipDsProxy = () => {
    setSkipDsProxy(true)
  }

  const getActiveStep = () => {
    if (!skipDsProxy && !isDsProxyDeployed) return 0;
    if (!tokenApprovalGranted) return 1;
    return 2;
  };

  useEffect(() => {
    const step = getActiveStep();
    setActiveStep(step);
  }, [skipDsProxy, isDsProxyDeployed, tokenApprovalGranted])

  const steps = ['Create honeylemon vault', `Approve ${COLLATERAL_TOKEN_NAME} collateral`, 'Offer Contract'];

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return `Create a honeylemon vault. The honeylemon vault will reduce the transaction fees paid when redeeming in future. This step is optional. This is a once-off operation.`;
      case 1:
        return `Approve Honeylemon smart contract access to your wallet’s ${COLLATERAL_TOKEN_NAME} allowance. Your ${COLLATERAL_TOKEN_NAME} collateral will be auto-deposited into smart contract based on the MRI value at the time of your order being filled.`;
      case 2:
        return `Finalize Offer`;
    }
  }

  const getStepButtonLabel = (step: number) => {
    switch (step) {
      case 0:
        return `Deploy`;
      case 1:
        return 'Approve';
      case 2:
        return `Offer`;
    }
  }

  const handleStepperNext = (step: number) => {
    switch (step) {
      case 0:
        return handleDeployDSProxy();
      case 1:
        return handleApproveCollateralToken();
      case 2:
        return handleCreateOffer();
    }
  }

  const handleStartOffer = () => {
    setSkipDsProxy(false);
    setShowOfferModal(true);
    activeStep === 2 && handleCreateOffer();
  }

  const handleOfferDetailsClick = () => {
    setShowOfferDetails(!showOfferDetails);
  };

  return (
    <>
      <Grid container alignItems='center' justify='flex-start' spacing={2}>
        <Grid item xs={12}>
          <MRIDisplay />
        </Grid>
        <Grid item xs={8}>
          <Typography style={{ fontWeight: 'bold' }}>Offer a {CONTRACT_DURATION}-day Mining Revenue Contract</Typography>
        </Grid>
        <Grid item xs={4} style={{ textAlign: 'end' }}>
          <Button
            onClick={() => setShowOrderbook(true)}
            className={classes.viewOfferButton}
            variant='contained'>
            View Offers
          </Button>
        </Grid>
        <Grid item xs={4}><Typography style={{ fontWeight: 'bold' }}>Price:</Typography></Grid>
        <Grid item xs={4}>
          <FilledInput
            fullWidth
            disableUnderline
            inputProps={{
              className: classes.inputBase,
              min: 0,
              step: 0.000001
            }}
            placeholder='0'
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
            value={hashPrice || ''}
            type='number'
            onBlur={e => {
              e.target.value = e.target.value.replace(/^(-)?0+(0\.|\d)/, '$1$2')
            }}
            disabled={showOfferModal} />
        </Grid>
        <Grid item xs={4} className={classes.rightAlign}>
          <Typography style={{ fontWeight: 'bold' }} color='primary'>/TH/Day</Typography>
        </Grid>
        <Grid item xs={4}><Typography style={{ fontWeight: 'bold' }}>Quantity</Typography></Grid>
        <Grid item xs={4}>
          <FilledInput
            fullWidth
            disableUnderline
            inputProps={{
              className: classes.inputBase,
              min: 0,
              step: 1
            }}
            placeholder='0'
            onChange={e => {
              const newValueString = e.target.value;
              if (!newValueString) {
                setHashAmount(0);
                return;
              }
              const newValue = parseInt(newValueString);
              !isNaN(newValue) && setHashAmount(newValue);
            }}
            value={hashAmount || ''}
            type='number'
            onBlur={e => {
              e.target.value = e.target.value.replace(/^(-)?0+(0\.|\d)/, '$1$2')
            }}
            disabled={showOfferModal} />
        </Grid>
        <Grid item xs={4} className={classes.rightAlign}>
          <Typography style={{ fontWeight: 'bold' }} color='primary'>TH</Typography>
        </Grid>
        <Typography onClick={() => {}}>
          You are offering a limit order, list your offer by approving imBTC allowance as collateral. <Info />
        </Typography>
        <Grid item xs={12} container>
          <Paper className={clsx(classes.offerSummary, {
            [classes.offerSummaryBlur]: !sufficientCollateral,
          })}>
            <Grid item container xs={12}>
              <Grid item xs={6}>
                <Typography align='left'><strong>Offer Summary</strong></Typography>
              </Grid>
              <Grid item xs={6} style={{ textAlign: 'right' }}>
                <Typography variant='caption'>
                  <Link href='#' underline='always' onClick={() => setShowContractSpecificationModal(true)}>
                    Contract Specs <Info fontSize='small' />
                  </Link>
                </Typography>
              </Grid>
            </Grid>
            <Table size='small'>
              <TableBody>
                <TableRow>
                  <TableCell>
                    Your Price <br />
                    Your Quantity <br />
                    Duration <br />
                  </TableCell>
                  <TableCell align='right'>
                    $ {hashPrice.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}/Th/Day <br />
                    {hashAmount?.toLocaleString()} TH <br />
                    {CONTRACT_DURATION} Days
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    Contract Total <br />
                    Estimated Collateral<br />
                    <br />
                  </TableCell>
                  <TableCell align='right'>
                    {`${totalContractPrice.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })} ${PAYMENT_TOKEN_NAME}`} <br />
                    {`${collateralAmount.toLocaleString(undefined, { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS })} ${COLLATERAL_TOKEN_NAME}`} <br />
                    {`(${CONTRACT_COLLATERAL_RATIO * 100} % MRI)`}
                  </TableCell>
                </TableRow>
                {!showOfferDetails ?
                  <TableRow>
                    <TableCell colSpan={2} align='center' onClick={handleOfferDetailsClick} style={{ cursor: 'pointer' }}>
                      Expand Details
                      <IconButton
                        className={classes.expand}
                        aria-label="show more">
                        <ExpandMore />
                      </IconButton>
                    </TableCell>
                  </TableRow> :
                  <>
                    <TableRow>
                      <TableCell>
                        Start <br />
                        Expiration <br />
                        Settlement <br />
                        Offer Valid Till
                      </TableCell>
                      <TableCell align='right'>
                        Order-fill Date UTC 00:01 <br />
                        {`${CONTRACT_DURATION} Days After Start`} <br />
                        24 Hours After Expiration <br />
                        {`${dayjs().add(10, 'd').format('DD-MMM-YY')}`}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2} style={{ color: '#a9a9a9' }}>
                        * Estimated collateral is calcuated based on current MRI value; actual collateral
                          deposited will be based on the actual MRI value at at the time your order being filled. <br />
                        * If you do not have sufficient {COLLATERAL_TOKEN_NAME} in your wallet as collateral when your offer is being taken,
                          a portion of the order will still be filled based on your available {COLLATERAL_TOKEN_NAME} balance at the time.<br />
                        * Your limit order may be partially filled. <br />
                        * Your offer will be valid for 10 days. Any unfilled portion of your limit order can be cancelled in your portfolio.<br />
                        * Your order will be subject to additional Ethereum network transaction fee,
                          and 0x Protocol fee, both denominated in ETH. Honeylemon does not charge&nbsp;
                        <Link component={RouterLink} to="/stats" underline='always' >fees.<OpenInNew fontSize='small' /></Link>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2} style={{ color: '#a9a9a9' }}>
                        <Typography variant='subtitle1'>WHAT DOES IT MEAN?</Typography> <br />
                        <Typography variant='body2'>
                          You are offering <strong>{hashAmount} TH</strong> of {CONTRACT_DURATION}-Day Mining Revenue Contract at&nbsp;
                          <strong>{PAYMENT_TOKEN_NAME} {hashPrice.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}/TH/Day</strong>.
                        </Typography>
                        <Typography variant='body2'>
                          You need to have at least <strong>{collateralAmount.toLocaleString(undefined, { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS })} {COLLATERAL_TOKEN_NAME}</strong> in
                          your wallet balance now, and approve Honeylemon smart contract to access your {COLLATERAL_TOKEN_NAME} in your wallet as collateral to list your offer.
                          You may cancel your offer from your Portfolio anytime prior to it being filled. As soon as your order is filled, your approved collateral will be
                          automatically deposited, you will receive payment in {PAYMENT_TOKEN_NAME} immediately and the contract will start.
                        </Typography>
                        <Typography variant='body2'>
                          At the end of <strong>{CONTRACT_DURATION} days</strong> your counterparty will receive the network average BTC block reward & transaction
                          fees per TH based on the average value of the <Link href='#' underline='always' onClick={() => setShowMRIInformationModal(true)}>Bitcoin Mining Revenue
                          Index (MRI_BTC) <Info fontSize='small' /></Link> over {CONTRACT_DURATION} days up to a <strong>max capped by your collateral</strong>.
                        </Typography>
                        <Typography variant='body2'>
                          The payoff will be directly deducted from your collateral, and you can withdraw the remainder of your collateral after settlement.
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2} align='center' onClick={handleOfferDetailsClick} style={{ cursor: 'pointer' }}>
                        Collapse Details
                        <IconButton className={clsx(classes.expand, classes.expandOpen)}>
                          <ExpandMore />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  </>
                }
              </TableBody>
            </Table>
          </Paper>
        </Grid>
        {errors.length > 0 &&
          <Grid item xs={12}>
            <List className={classes.errorList}>
              {errors.map((error, i) =>
                <ListItem key={i}>
                  <ListItemText>{error}</ListItemText>
                </ListItem>)}
            </List>
          </Grid>
        }
        <Grid item xs={12}>
          <Button
            fullWidth
            variant='contained'
            color='primary'
            onClick={handleStartOffer}
            disabled={hashAmount === 0 || !sufficientCollateral || showOfferModal}>
            OFFER LIMIT ORDER &nbsp;
              {showOfferModal && <CircularProgress className={classes.loadingSpinner} size={20} />}
          </Button>
        </Grid>
      </Grid>
      <Dialog
        open={showOfferModal}
        onClose={handleCloseOfferDialog}
        aria-labelledby="form-dialog-title"
        disableBackdropClick
        disableEscapeKeyDown>
        <DialogTitle id="form-dialog-title">Create Offer</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  <Typography paragraph>{getStepContent(index)}</Typography>
                  {errorMessage && <Typography color='error'>{errorMessage}</Typography>}
                  <div className={classes.actionsContainer}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleStepperNext(activeStep)}
                      className={classes.button}
                      disabled={txActive}>
                      {getStepButtonLabel(activeStep)}&nbsp;
                        {txActive && <CircularProgress className={classes.loadingSpinner} size={20} />}
                    </Button>
                    {activeStep === 0 ?
                      <Button
                        variant="contained"
                        color='secondary'
                        onClick={handleSkipDsProxy}
                        className={classes.button}
                        disabled={txActive}>
                        Skip
                      </Button> :
                      <Button
                        onClick={handleCloseOfferDialog}
                        className={classes.button}
                        disabled={txActive}>
                        Cancel
                      </Button>
                    }
                  </div>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
      </Dialog>
      <ContractSpecificationModal open={showContractSpecificationModal} onClose={() => setShowContractSpecificationModal(false)} />
      <OrderbookModal open={showOrderbook} onClose={() => setShowOrderbook(false)} />
      <MRIInformationModal open={showMRIInformationModal} onClose={() => setShowMRIInformationModal(false)} />
    </>
  )
}

export default OfferContractPage;
