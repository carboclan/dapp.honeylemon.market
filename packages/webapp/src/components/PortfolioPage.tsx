import React, { useState, useEffect } from "react";
import {
  Typography,
  Grid,
  makeStyles,
  Tabs,
  Tab,
  Button,
  TableRow,
  TableHead,
  TableCell,
  Table,
  TableBody,
  Divider,
  CircularProgress,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
  Link
} from "@material-ui/core";
import { ExpandMore, RadioButtonUnchecked, MoreVert } from "@material-ui/icons";
import { useOnboard } from "../contexts/OnboardContext";
import {
  useHoneylemon,
  PositionStatus,
  PositionType
} from "../contexts/HoneylemonContext";
import { usePrevious } from "../helpers/usePrevious";
import dayjs from "dayjs";
import ActiveLongPositionModal from "./ActiveLongPositionModal";
import ActiveShortPositionModal from "./ActiveShortPositionModal";
import ExpiredLongPositionModal from "./ExpiredLongPositionModal";
import ExpiredShortPositionModal from "./ExpiredShortPositionModal";
import UnfilledOfferModal from "./UnfilledOfferModal";
import TimeRemaining from "./TimeRemaining";
import * as Sentry from "@sentry/react";
import { Trans, t } from "@lingui/macro";
import { useLingui } from "@lingui/react";

const useStyles = makeStyles(({ spacing, palette }) => ({
  icon: {
    marginLeft: spacing(1)
  },
  rightAlign: {
    textAlign: "end"
  },
  tabContent: {
    paddingTop: spacing(2)
  },
  sectionDivider: {
    margin: spacing(2),
    height: spacing(0.5)
  },
  loadingSpinner: {
    width: 20,
    flexBasis: "end",
    flexGrow: 0,
    color: palette.primary.main
  },
  sectionHeadingText: {
    fontWeight: "bold",
    color: palette.primary.main
  },
  placeholderRow: {
    height: 60
  },
  infoButton: {
    color: palette.primary.main
  },
  sectionHeading: {
    justifyContent: "space-between"
  }
}));

const PorfolioPage: React.SFC = () => {
  const { i18n } = useLingui();
  const { address, gasPrice } = useOnboard();
  const {
    honeylemonService,
    CONTRACT_DURATION,
    refreshPortfolio,
    portfolioData,
    COLLATERAL_TOKEN_NAME,
    PAYMENT_TOKEN_NAME,
    COLLATERAL_TOKEN_DECIMALS,
    PAYMENT_TOKEN_DECIMALS,
    isPortfolioRefreshing
  } = useHoneylemon();

  const {
    openOrdersMetadata,
    activeLongPositions,
    activeShortPositions,
    expiredLongPositions,
    expiredShortPositions
  } = portfolioData;

  const [activeTab, setActiveTab] = useState<"active" | "withdraw" | "expired">("active");
  const [longCollateralForBatchWithdraw, setLongCollateralForBatchWithdraw] = useState<
    number
  >(0);
  const [shortCollateralForBatchWithdraw, setShortCollateralForBatchWithdraw] = useState<
    number
  >(0);

  const [
    longCollateralForIndividualWithdraw,
    setLongCollateralForIndividualWithdraw
  ] = useState<number>(0);
  const [
    shortCollateralForIndividualWithdraw,
    setShortCollateralForIndividualWithdraw
  ] = useState<number>(0);

  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [showOpenOrders, setShowOpenOrders] = useState(false);
  const [unfilledOfferModalIndex, setUnfilledOfferModalIndex] = useState(-1);
  const [showUnfilledOfferModal, setShowUnfilledOfferModal] = useState(false);

  const [showActiveLongPositions, setShowActiveLongPositions] = useState(false);
  const [showActiveLongPositionModal, setShowActiveLongPositionModal] = useState(false);
  const [activeLongPositionModalIndex, setActiveLongPositionModalIndex] = useState(-1);

  const [showActiveShortPositions, setShowActiveShortPositions] = useState(false);
  const [showActiveShortPositionModal, setShowActiveShortPositionModal] = useState(false);
  const [activeShortPositionModalIndex, setActiveShortPositionModalIndex] = useState(-1);

  const [showExpiredLongPositions, setShowExpiredLongPositions] = useState(false);
  const [showExpiredLongPositionModal, setShowExpiredLongPositionModal] = useState(false);
  const [expiredLongPositionModalIndex, setExpiredLongPositionModalIndex] = useState(-1);

  const [showExpiredShortPositions, setShowExpiredShortPositions] = useState(false);
  const [showExpiredShortPositionModal, setShowExpiredShortPositionModal] = useState(
    false
  );
  const [expiredShortPositionModalIndex, setExpiredShortPositionModalIndex] = useState(
    -1
  );

  const handleSetActiveTab = (
    event: React.ChangeEvent<{}>,
    newValue: "active" | "withdraw" | "expired"
  ) => {
    setActiveTab(newValue);
  };

  const batchWithdraw = async () => {
    setIsWithdrawing(true);
    if (!honeylemonService) return;
    try {
      await honeylemonService.batchRedeem(address);
      await new Promise(async resolve => {
        await setTimeout(refreshPortfolio, 10000);
        resolve();
      });
    } catch (error) {
      console.log("Something went wrong during the withdrawl");
      console.log(error);
      Sentry.captureException(error);
    }
    setIsWithdrawing(false);
  };

  const withdrawPosition = async (
    positionTokenAddress: string,
    marketContractAddress: string,
    amount: string,
    type: PositionType
  ) => {
    if (!honeylemonService || !address) return;
    setIsWithdrawing(true);
    try {
      await honeylemonService.redeemPosition(
        address,
        positionTokenAddress,
        marketContractAddress,
        amount,
        type,
        gasPrice
      );
      await new Promise(async resolve => {
        await setTimeout(refreshPortfolio, 10000);
        resolve();
      });
    } catch (error) {
      console.log("Something went wrong during the withdrawal");
      console.log(error);
      Sentry.captureException(error);
    }
    setIsWithdrawing(false);
  };

  const handleToggleOpenOrdersPanel = () => {
    setShowOpenOrders(!showOpenOrders);
  };

  const handleToggleActiveLongPositionsPanel = () => {
    setShowActiveLongPositions(!showActiveLongPositions);
  };

  const handleToggleActiveShortPositionsPanel = () => {
    setShowActiveShortPositions(!showActiveShortPositions);
  };

  const handleToggleExpiredLongPositionsPanel = () => {
    setShowExpiredLongPositions(!showExpiredLongPositions);
  };

  const handleToggleExpiredShortPositionsPanel = () => {
    setShowExpiredShortPositions(!showExpiredShortPositions);
  };

  const handleShowActiveLongPositionDetails = (i: number) => {
    setActiveLongPositionModalIndex(i);
    setShowActiveLongPositionModal(true);
  };

  const handleShowActiveShortPositionDetails = (i: number) => {
    setActiveShortPositionModalIndex(i);
    setShowActiveShortPositionModal(true);
  };

  const handleShowExpiredLongPositionDetails = (i: number) => {
    setExpiredLongPositionModalIndex(i);
    setShowExpiredLongPositionModal(true);
  };

  const handleShowExpiredShortPositionDetails = (i: number) => {
    setExpiredShortPositionModalIndex(i);
    setShowExpiredShortPositionModal(true);
  };

  const handleShowUnfilledOfferDetails = (i: number) => {
    setUnfilledOfferModalIndex(i);
    setShowUnfilledOfferModal(true);
  };

  const classes = useStyles();

  const previousOpenOrdersCount = usePrevious(openOrdersMetadata.length);
  const previousActiveLongPositionsCount = usePrevious(activeLongPositions.length);
  const previousActiveShortPositionsCount = usePrevious(activeShortPositions.length);

  const previousExpiredLongPositionsCount = usePrevious(expiredLongPositions.length);
  const previousExpiredShortPositionsCount = usePrevious(expiredShortPositions.length);

  useEffect(() => {
    const loadPortfolioData = async () => {
      await refreshPortfolio();
    };
    loadPortfolioData();
  }, [address]);

  useEffect(() => {
    (previousOpenOrdersCount === 0 || !previousOpenOrdersCount) &&
      openOrdersMetadata.length > 0 &&
      setShowOpenOrders(true);
    (previousActiveLongPositionsCount === 0 || !previousActiveLongPositionsCount) &&
      activeLongPositions.length > 0 &&
      setShowActiveLongPositions(true);
    (previousActiveShortPositionsCount === 0 || !previousActiveShortPositionsCount) &&
      activeShortPositions.length > 0 &&
      setShowActiveShortPositions(true);
    (previousExpiredLongPositionsCount === 0 || !previousExpiredLongPositionsCount) &&
      expiredLongPositions.length > 0 &&
      setShowExpiredLongPositions(true);
    (previousActiveShortPositionsCount === 0 || !previousActiveShortPositionsCount) &&
      expiredShortPositions.length > 0 &&
      setShowExpiredShortPositions(true);

    previousOpenOrdersCount > 0 &&
      openOrdersMetadata.length === 0 &&
      setShowOpenOrders(false);
    previousActiveLongPositionsCount > 0 &&
      activeLongPositions.length === 0 &&
      setShowActiveLongPositions(false);
    previousActiveShortPositionsCount > 0 &&
      activeShortPositions.length === 0 &&
      setShowActiveShortPositions(false);
    previousExpiredLongPositionsCount > 0 &&
      expiredLongPositions.length === 0 &&
      setShowExpiredLongPositions(false);
    previousExpiredShortPositionsCount > 0 &&
      expiredShortPositions.length === 0 &&
      setShowExpiredShortPositions(false);
  }, [
    previousOpenOrdersCount,
    openOrdersMetadata,
    previousActiveLongPositionsCount,
    activeLongPositions,
    previousActiveShortPositionsCount,
    activeShortPositions,
    previousExpiredLongPositionsCount,
    expiredLongPositions,
    previousExpiredShortPositionsCount,
    expiredShortPositions
  ]);

  useEffect(() => {
    const longCollateralForBatchWithdraw = expiredLongPositions
      .filter(p => p.status === PositionStatus.withdrawalPending && p.canBeBatchRedeemed)
      .reduce((total: Number, position: any) => (total += position?.finalReward), 0);
    setLongCollateralForBatchWithdraw(longCollateralForBatchWithdraw);

    const shortCollateralForBatchWithdraw = expiredShortPositions
      .filter(p => p.status === PositionStatus.withdrawalPending && p.canBeBatchRedeemed)
      .reduce((total: Number, position: any) => (total += position?.finalReward), 0);
    setShortCollateralForBatchWithdraw(shortCollateralForBatchWithdraw);

    const longCollateralForIndividualWithdraw = expiredLongPositions
      .filter(p => p.status === PositionStatus.withdrawalPending && !p.canBeBatchRedeemed)
      .reduce((total: Number, position: any) => (total += position?.finalReward), 0);
    setLongCollateralForIndividualWithdraw(longCollateralForIndividualWithdraw);

    const shortCollateralForIndividualWithdraw = expiredShortPositions
      .filter(p => p.status === PositionStatus.withdrawalPending && !p.canBeBatchRedeemed)
      .reduce((total: Number, position: any) => (total += position?.finalReward), 0);
    setShortCollateralForIndividualWithdraw(shortCollateralForIndividualWithdraw);
  }, [expiredLongPositions, expiredShortPositions]);

  const showWithdrawTab =
    longCollateralForBatchWithdraw +
      shortCollateralForBatchWithdraw +
      longCollateralForIndividualWithdraw +
      shortCollateralForIndividualWithdraw >
    0;
  if (activeTab === "withdraw" && !showWithdrawTab) {
    setActiveTab("active");
  }

  return (
    <>
      <Grid container>
        <Grid item xs={12}>
          <Typography
            variant="h5"
            style={{ fontWeight: "bold", textAlign: "center" }}
            color="primary"
          >
            <Trans>Portfolio</Trans>
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Tabs
            value={activeTab}
            onChange={handleSetActiveTab}
            indicatorColor="secondary"
            variant="fullWidth"
          >
            <Tab label={i18n._(t`Active`)} value="active" />
            <Tab label={i18n._(t`Settled`)} value="expired" />
            {showWithdrawTab && <Tab label={i18n._(t`Redeem`)} value="withdraw" />}
          </Tabs>
          <Grid item style={{ paddingTop: 8 }}>
            <Typography variant="caption">
              <Trans>
                This page refreshes every 30 seconds. Click{" "}
                <Link href="#" onClick={refreshPortfolio}>
                  here
                </Link>{" "}
                to refresh.
              </Trans>
            </Typography>
          </Grid>
          <div className={classes.tabContent}>
            {activeTab === "active" && (
              <>
                <ExpansionPanel expanded={showActiveLongPositions}>
                  <ExpansionPanelSummary
                    expandIcon={<ExpandMore />}
                    classes={{
                      content: classes.sectionHeading
                    }}
                    IconButtonProps={{ onClick: handleToggleActiveLongPositionsPanel }}
                  >
                    <Typography
                      variant="subtitle1"
                      className={classes.sectionHeadingText}
                    >
                      <b>
                        {activeLongPositions.length > 0 &&
                          `${activeLongPositions.length} `}
                        <Trans>Contracts Bought (Long)</Trans>
                      </b>
                    </Typography>
                    {isPortfolioRefreshing && (
                      <CircularProgress className={classes.loadingSpinner} size={20} />
                    )}
                  </ExpansionPanelSummary>
                  <ExpansionPanelDetails>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell align="center">
                            <Trans>Days till Expiration</Trans>
                          </TableCell>
                          <TableCell align="center">
                            <Trans>Cost</Trans> ({PAYMENT_TOKEN_NAME})
                          </TableCell>
                          <TableCell align="center">
                            <Trans>Revenue Accrued</Trans> ({COLLATERAL_TOKEN_NAME})
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activeLongPositions &&
                          activeLongPositions?.map((position: any, i) => (
                            <TableRow key={i}>
                              <TableCell align="center">
                                <TimeRemaining
                                  totalDuration={CONTRACT_DURATION}
                                  remainingDuration={position.daysToExpiration}
                                  unitLabel="d"
                                />
                              </TableCell>
                              <TableCell align="center">
                                {position.totalCost.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </TableCell>
                              <TableCell align="center">
                                {position.pendingReward.toLocaleString(undefined, {
                                  maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS
                                })}
                              </TableCell>
                              <TableCell align="right">
                                <MoreVert
                                  onClick={() => handleShowActiveLongPositionDetails(i)}
                                  style={{ cursor: "pointer" }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        {!isPortfolioRefreshing && activeLongPositions.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              align="center"
                              className={classes.placeholderRow}
                            >
                              <Trans>No Active Long Positions</Trans>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ExpansionPanelDetails>
                </ExpansionPanel>
                <Divider className={classes.sectionDivider} light variant="middle" />
                <ExpansionPanel expanded={showActiveShortPositions}>
                  <ExpansionPanelSummary
                    expandIcon={<ExpandMore />}
                    classes={{
                      content: classes.sectionHeading
                    }}
                    IconButtonProps={{ onClick: handleToggleActiveShortPositionsPanel }}
                  >
                    <Typography
                      variant="subtitle1"
                      className={classes.sectionHeadingText}
                    >
                      <b>
                        {activeShortPositions.length > 0 &&
                          `${activeShortPositions.length} `}
                        <Trans>Contracts Offered (Short)</Trans>
                      </b>
                    </Typography>
                    {isPortfolioRefreshing && (
                      <CircularProgress className={classes.loadingSpinner} size={20} />
                    )}
                  </ExpansionPanelSummary>
                  <ExpansionPanelDetails>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell align="center">
                            <Trans>Days till Expiration</Trans>
                          </TableCell>
                          <TableCell align="center">
                            <Trans>Received</Trans> ({PAYMENT_TOKEN_NAME})
                          </TableCell>
                          <TableCell align="center">
                            <Trans>Collateral Locked</Trans> ({COLLATERAL_TOKEN_NAME})
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activeShortPositions &&
                          activeShortPositions?.map((position: any, i) => (
                            <TableRow key={i}>
                              <TableCell align="center">
                                <TimeRemaining
                                  totalDuration={CONTRACT_DURATION}
                                  remainingDuration={position.daysToExpiration}
                                  unitLabel="d"
                                />
                              </TableCell>
                              <TableCell align="center">
                                {position.totalCost.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </TableCell>
                              <TableCell align="center">
                                {position.totalCollateralLocked.toLocaleString(
                                  undefined,
                                  { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS }
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <MoreVert
                                  onClick={() => handleShowActiveShortPositionDetails(i)}
                                  style={{ cursor: "pointer" }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        {!isPortfolioRefreshing && activeShortPositions.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              align="center"
                              className={classes.placeholderRow}
                            >
                              <Trans>No Active Short Positions</Trans>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ExpansionPanelDetails>
                </ExpansionPanel>
                <Divider className={classes.sectionDivider} light variant="middle" />
                <ExpansionPanel expanded={showOpenOrders}>
                  <ExpansionPanelSummary
                    expandIcon={<ExpandMore />}
                    classes={{
                      content: classes.sectionHeading
                    }}
                    IconButtonProps={{ onClick: handleToggleOpenOrdersPanel }}
                  >
                    <Typography
                      variant="subtitle1"
                      className={classes.sectionHeadingText}
                    >
                      <b>
                        {openOrdersMetadata.length > 0 && `${openOrdersMetadata.length} `}
                        <Trans>Open Offers (Unfilled Short)</Trans>
                      </b>
                    </Typography>
                    {isPortfolioRefreshing && (
                      <CircularProgress className={classes.loadingSpinner} size={20} />
                    )}
                  </ExpansionPanelSummary>
                  <ExpansionPanelDetails>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <Trans>Price ($/TH/Day)</Trans>
                          </TableCell>
                          <TableCell align="center">
                            <Trans>Quantity (TH)</Trans>
                          </TableCell>
                          <TableCell align="right">
                            <Trans>Contract Total</Trans> ({PAYMENT_TOKEN_NAME})
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {openOrdersMetadata &&
                          openOrdersMetadata?.map((order, i) => (
                            <TableRow key={order.orderHash}>
                              <TableCell>
                                $
                                {Number(
                                  order?.price.dividedBy(CONTRACT_DURATION).toString()
                                ).toLocaleString(undefined, {
                                  maximumFractionDigits: PAYMENT_TOKEN_DECIMALS
                                })}
                              </TableCell>
                              <TableCell align="center">
                                {Number(
                                  order?.remainingFillableMakerAssetAmount.toString()
                                ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell align="right">
                                {Number(
                                  order.price.multipliedBy(
                                    order.remainingFillableMakerAssetAmount
                                  )
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </TableCell>
                              <TableCell align="right">
                                <MoreVert
                                  onClick={() => handleShowUnfilledOfferDetails(i)}
                                  style={{ cursor: "pointer" }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        {!isPortfolioRefreshing && openOrdersMetadata.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              align="center"
                              className={classes.placeholderRow}
                            >
                              <Trans>No Unfilled Positions (Open Orders)</Trans>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ExpansionPanelDetails>
                </ExpansionPanel>
              </>
            )}
            {activeTab === "expired" && (
              <>
                <ExpansionPanel expanded={showExpiredLongPositions}>
                  <ExpansionPanelSummary
                    expandIcon={<ExpandMore />}
                    classes={{
                      content: classes.sectionHeading
                    }}
                    IconButtonProps={{ onClick: handleToggleExpiredLongPositionsPanel }}
                  >
                    <Typography
                      variant="subtitle1"
                      className={classes.sectionHeadingText}
                    >
                      <b>
                        {expiredLongPositions.length > 0 &&
                          `${expiredLongPositions.length} `}
                        <Trans>Contracts Bought (Long)</Trans>
                      </b>
                    </Typography>
                    {isPortfolioRefreshing && (
                      <CircularProgress className={classes.loadingSpinner} size={20} />
                    )}
                  </ExpansionPanelSummary>
                  <ExpansionPanelDetails>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell align="center">
                            <Trans>Cost</Trans> ({PAYMENT_TOKEN_NAME})
                          </TableCell>
                          <TableCell align="center">
                            <Trans>Received</Trans> ({COLLATERAL_TOKEN_NAME})
                          </TableCell>
                          <TableCell align="right">
                            <Trans>Status</Trans>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {expiredLongPositions &&
                          expiredLongPositions?.map((position: any, i) => (
                            <TableRow key={i}>
                              <TableCell align="center">
                                {position.totalCost.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </TableCell>
                              <TableCell align="center">{position.finalReward}</TableCell>
                              <TableCell align="center">{position.status}</TableCell>
                              <TableCell align="right">
                                <MoreVert
                                  onClick={() => handleShowExpiredLongPositionDetails(i)}
                                  style={{ cursor: "pointer" }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        {!isPortfolioRefreshing && expiredLongPositions.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              align="center"
                              className={classes.placeholderRow}
                            >
                              <Trans>No Expired Long Positions</Trans>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ExpansionPanelDetails>
                </ExpansionPanel>
                <Divider className={classes.sectionDivider} light variant="middle" />
                <ExpansionPanel expanded={showExpiredShortPositions}>
                  <ExpansionPanelSummary
                    expandIcon={<ExpandMore />}
                    classes={{
                      content: classes.sectionHeading
                    }}
                    IconButtonProps={{ onClick: handleToggleExpiredShortPositionsPanel }}
                  >
                    <Typography
                      variant="subtitle1"
                      className={classes.sectionHeadingText}
                    >
                      <b>
                        {expiredShortPositions.length > 0 &&
                          `${expiredShortPositions.length} `}
                        <Trans>Contracts Sold (Short)</Trans>
                      </b>
                    </Typography>
                    {isPortfolioRefreshing && (
                      <CircularProgress className={classes.loadingSpinner} size={20} />
                    )}
                  </ExpansionPanelSummary>
                  <ExpansionPanelDetails>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell align="center">
                            <Trans>Received</Trans> ({PAYMENT_TOKEN_NAME})
                          </TableCell>
                          <TableCell align="center">
                            <Trans>Paid</Trans> ({COLLATERAL_TOKEN_NAME})
                          </TableCell>
                          <TableCell align="center">
                            <Trans>Status</Trans>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {expiredShortPositions &&
                          expiredShortPositions?.map((position: any, i) => (
                            <TableRow key={i}>
                              <TableCell align="center">
                                {position.totalCost.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </TableCell>
                              <TableCell align="center">
                                {(
                                  position.totalCollateralLocked - position.finalReward
                                ).toLocaleString(undefined, {
                                  maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS
                                })}
                              </TableCell>
                              <TableCell align="center">{position.status}</TableCell>
                              <TableCell align="right">
                                <MoreVert
                                  onClick={() => handleShowExpiredShortPositionDetails(i)}
                                  style={{ cursor: "pointer" }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        {!isPortfolioRefreshing && expiredShortPositions.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              align="center"
                              className={classes.placeholderRow}
                            >
                              <Trans>No Expired Short Positions</Trans>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ExpansionPanelDetails>
                </ExpansionPanel>
              </>
            )}
            {activeTab === "withdraw" && (
              <>
                <ExpansionPanel expanded={true}>
                  <ExpansionPanelSummary
                    classes={{
                      content: classes.sectionHeading
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      className={classes.sectionHeadingText}
                    >
                      <b>
                        <Trans>Honeylemon Vault Positions</Trans>
                      </b>
                    </Typography>
                    {isPortfolioRefreshing && (
                      <CircularProgress className={classes.loadingSpinner} size={20} />
                    )}
                  </ExpansionPanelSummary>
                  <ExpansionPanelDetails>
                    <Grid container direction="row">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <Trans>Position</Trans>
                            </TableCell>
                            <TableCell align="center">
                              <Trans>Total</Trans> ({COLLATERAL_TOKEN_NAME})
                            </TableCell>
                            <TableCell align="right">
                              <Trans>No of Contracts</Trans>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>
                              <Trans>Long</Trans>
                            </TableCell>
                            <TableCell align="center">
                              {longCollateralForBatchWithdraw.toLocaleString(undefined, {
                                maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS
                              })}
                            </TableCell>
                            <TableCell align="right">
                              {
                                expiredLongPositions.filter(
                                  p =>
                                    p.status === PositionStatus.withdrawalPending &&
                                    p.canBeBatchRedeemed
                                ).length
                              }
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <Trans>Short</Trans>
                            </TableCell>
                            <TableCell align="center">
                              {shortCollateralForBatchWithdraw.toLocaleString(undefined, {
                                maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS
                              })}
                            </TableCell>
                            <TableCell align="right">
                              {
                                expiredShortPositions.filter(
                                  p =>
                                    p.status === PositionStatus.withdrawalPending &&
                                    p.canBeBatchRedeemed
                                ).length
                              }
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      <Grid item xs={12} style={{ paddingTop: 8, paddingBottom: 8 }}>
                        <Button
                          disabled={
                            longCollateralForBatchWithdraw +
                              shortCollateralForBatchWithdraw ===
                              0 || isWithdrawing
                          }
                          onClick={batchWithdraw}
                          variant="contained"
                          color="primary"
                          fullWidth
                        >
                          {!isWithdrawing ? (
                            longCollateralForBatchWithdraw +
                              shortCollateralForBatchWithdraw >
                            0 ? (
                              <>
                                <Trans>REDEEM ALL</Trans>{" "}
                                {`(${(
                                  longCollateralForBatchWithdraw +
                                  shortCollateralForBatchWithdraw
                                ).toLocaleString(undefined, {
                                  maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS
                                })} ${COLLATERAL_TOKEN_NAME})`}
                              </>
                            ) : (
                              <>
                                <Trans>REDEEM ALL</Trans>{" "}
                                <RadioButtonUnchecked className={classes.icon} />
                              </>
                            )
                          ) : (
                            <>
                              <Trans>REDEEM ALL</Trans>{" "}
                              <CircularProgress
                                className={classes.loadingSpinner}
                                size={20}
                              />
                            </>
                          )}
                        </Button>
                      </Grid>
                    </Grid>
                  </ExpansionPanelDetails>
                </ExpansionPanel>
                <Divider className={classes.sectionDivider} light variant="middle" />
                <ExpansionPanel expanded={true}>
                  <ExpansionPanelSummary
                    classes={{
                      content: classes.sectionHeading
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      className={classes.sectionHeadingText}
                    >
                      <b>
                        <Trans>Other Positions</Trans>
                      </b>
                    </Typography>
                  </ExpansionPanelSummary>
                  <ExpansionPanelDetails>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>
                            <Trans>Position</Trans>
                          </TableCell>
                          <TableCell align="center">
                            <Trans>Amount</Trans> ({COLLATERAL_TOKEN_NAME})
                          </TableCell>
                          <TableCell align="center">
                            <Trans>Settlement</Trans>
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {expiredLongPositions
                          .concat(expiredShortPositions)
                          .filter(
                            p =>
                              p.status === PositionStatus.withdrawalPending &&
                              !p.canBeBatchRedeemed
                          )
                          .sort((a, b) => (a.settlementDate < b.settlementDate ? -1 : 1))
                          .map(p => (
                            <TableRow key={p.transaction.id}>
                              <TableCell>{p.type}</TableCell>
                              <TableCell align="center">
                                {p.finalReward.toLocaleString(undefined, {
                                  maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS
                                })}
                              </TableCell>
                              <TableCell align="center">
                                {dayjs(p.settlementDate).format("DD-MMM-YY")}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  disabled={isWithdrawing}
                                  onClick={() =>
                                    withdrawPosition(
                                      p.type === PositionType.Long
                                        ? p.longTokenAddress
                                        : p.shortTokenAddress,
                                      p.contract.id,
                                      p.qtyToMint,
                                      p.type
                                    )
                                  }
                                >
                                  <Trans>REDEEM</Trans>{" "}
                                  {isWithdrawing && (
                                    <CircularProgress
                                      className={classes.loadingSpinner}
                                      size={20}
                                    />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </ExpansionPanelDetails>
                </ExpansionPanel>
              </>
            )}
          </div>
        </Grid>
      </Grid>
      {activeLongPositionModalIndex > -1 &&
        activeLongPositions[activeLongPositionModalIndex] && (
          <ActiveLongPositionModal
            open={showActiveLongPositionModal}
            onClose={() => setShowActiveLongPositionModal(false)}
            position={activeLongPositions[activeLongPositionModalIndex]}
          />
        )}
      {activeShortPositionModalIndex > -1 &&
        activeShortPositions[activeShortPositionModalIndex] && (
          <ActiveShortPositionModal
            open={showActiveShortPositionModal}
            onClose={() => setShowActiveShortPositionModal(false)}
            position={activeShortPositions[activeShortPositionModalIndex]}
          />
        )}
      {expiredLongPositionModalIndex > -1 &&
        expiredLongPositions[expiredLongPositionModalIndex] && (
          <ExpiredLongPositionModal
            open={showExpiredLongPositionModal}
            onClose={() => setShowExpiredLongPositionModal(false)}
            position={expiredLongPositions[expiredLongPositionModalIndex]}
            withdrawPosition={withdrawPosition}
            isWithdrawing
          />
        )}
      {expiredShortPositionModalIndex > -1 &&
        expiredShortPositions[expiredShortPositionModalIndex] && (
          <ExpiredShortPositionModal
            open={showExpiredShortPositionModal}
            onClose={() => setShowExpiredShortPositionModal(false)}
            position={expiredShortPositions[expiredShortPositionModalIndex]}
            withdrawPosition={withdrawPosition}
            isWithdrawing
          />
        )}
      {unfilledOfferModalIndex > -1 && openOrdersMetadata[unfilledOfferModalIndex] && (
        <UnfilledOfferModal
          open={showUnfilledOfferModal}
          onClose={() => setShowUnfilledOfferModal(false)}
          offer={openOrdersMetadata[unfilledOfferModalIndex]}
        />
      )}
    </>
  );
};

export default PorfolioPage;
