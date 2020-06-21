import React, { useState, useEffect } from 'react';
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
  ButtonBase,
  CircularProgressProps,
  Box,
} from '@material-ui/core';
import { ExpandMore, RadioButtonUnchecked, InfoRounded, Info } from '@material-ui/icons';
import { useOnboard } from '../contexts/OnboardContext';
import { useHoneylemon, PositionStatus } from '../contexts/HoneylemonContext';
import { usePrevious } from '../helpers/usePrevious';
import dayjs from 'dayjs';
import ActiveLongPositionModal from './ActiveLongPositionModal';
import ActiveShortPositionModal from './ActiveShortPositionModal';
import ExpiredLongPositionModal from './ExpiredLongPositionModal';
import ExpiredShortPositionModal from './ExpiredShortPositionModal';

const useStyles = makeStyles(({ spacing, palette }) => ({
  icon: {
    marginLeft: spacing(1),
  },
  rightAlign: {
    textAlign: 'end',
  },
  tabContent: {
    paddingTop: spacing(2)
  },
  sectionDivider: {
    margin: spacing(2),
    height: spacing(0.5),
  },
  loadingSpinner: {
    width: 20,
    flexBasis: 'end',
    flexGrow: 0,
    color: palette.secondary.main,
  },
  sectionHeadingText: {
    fontWeight: 'bold',
    color: palette.secondary.main,
  },
  placeholderRow: {
    height: 60,
  },
  infoButton: {
    color: palette.secondary.main,
  },
  sectionHeading: {
    justifyContent: 'space-between',
  }
}))

const TimeRemaining = (
  props: CircularProgressProps & {
    totalDuration: number,
    remainingDuration: number,
    unitLabel: 'd' | 'h'
  }) => {
  const { totalDuration, remainingDuration, unitLabel, ...cirularProgressProps } = props;
  return (
    <Box position="relative" display="inline-flex">
      <CircularProgress variant="static" {...cirularProgressProps} value={(1 - remainingDuration / totalDuration) * 100} color='secondary' />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="caption" component="div" color="textSecondary">
          {`${remainingDuration}${unitLabel}`}
        </Typography>
      </Box>
    </Box>
  )
};

const PorfolioPage: React.SFC = () => {
  const { address } = useOnboard();
  const {
    honeylemonService,
    CONTRACT_DURATION,
    refreshPortfolio,
    portfolioData,
    COLLATERAL_TOKEN_NAME,
    PAYMENT_TOKEN_NAME,
    COLLATERAL_TOKEN_DECIMALS,
    PAYMENT_TOKEN_DECIMALS,
  } = useHoneylemon();

  const {
    openOrders,
    openOrdersMetadata,
    activeLongPositions,
    activeShortPositions,
    expiredLongPositions,
    expiredShortPositions
  } = portfolioData;

  const [activeTab, setActiveTab] = useState<'active' | 'expired'>('active')
  const [collateralForWithdraw, setCollateralForWithdraw] = useState<Number>(0);

  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [showOpenOrders, setShowOpenOrders] = useState(false);

  const [showActiveLongPositions, setShowActiveLongPositions] = useState(false);
  const [showActiveLongPositionModal, setShowActiveLongPositionModal] = useState(false);
  const [activeLongPositionModalIndex, setActiveLongPositionModalIndex] = useState(-1);

  const [showActiveShortPositions, setShowActiveShortPositions] = useState(false);
  const [showActiveShortPositionModal, setShowActiveShortPositionModal] = useState(false);
  const [activeShortPositionModalIndex, setActiveShortPositionModalIndex] = useState(-1);

  const [showPendingWithdraw, setShowPendingWithdraw] = useState(false);

  const [showExpiredLongPositions, setShowExpiredLongPositions] = useState(false);
  const [showExpiredLongPositionModal, setShowExpiredLongPositionModal] = useState(false);
  const [expiredLongPositionModalIndex, setExpiredLongPositionModalIndex] = useState(-1);

  const [showExpiredShortPositions, setShowExpiredShortPositions] = useState(false);
  const [showExpiredShortPositionModal, setShowExpiredShortPositionModal] = useState(false);
  const [expiredShortPositionModalIndex, setExpiredShortPositionModalIndex] = useState(-1);

  const handleSetActiveTab = (event: React.ChangeEvent<{}>, newValue: 'active' | 'expired') => {
    setActiveTab(newValue);
  };

  const cancelOpenOrder = async (orderHash: string) => {
    const order = openOrders?.[orderHash];
    if (!order) {
      console.log('This order does not exist.')
      return;
    }
    setIsCancelling(true);

    try {
      await honeylemonService.getCancelOrderTx(order)
        .awaitTransactionSuccessAsync({
          from: address,
          gas: 1500000
        });
      refreshPortfolio();
    } catch (error) {
      console.log(error)
    }
    setIsCancelling(false)
  }

  const withdrawAllAvailable = async () => {
    setIsWithdrawing(true);
    try {
      await honeylemonService.batchRedeem(address);
      refreshPortfolio();
    } catch (error) {
      console.log("Something went wrong during the withdrawl");
      console.log(error);
    }
    setIsWithdrawing(false);
  }

  const handleToggleOpenOrdersPanel = () => {
    setShowOpenOrders(!showOpenOrders);
  }

  const handleToggleActiveLongPositionsPanel = () => {
    setShowActiveLongPositions(!showActiveLongPositions);
  }

  const handleToggleActiveShortPositionsPanel = () => {
    setShowActiveShortPositions(!showActiveShortPositions);
  }

  const handleTogglePendingWithdrawPanel = () => {
    setShowPendingWithdraw(!showPendingWithdraw);
  }
  const handleToggleExpiredLongPositionsPanel = () => {
    setShowExpiredLongPositions(!showExpiredLongPositions);
  }

  const handleToggleExpiredShortPositionsPanel = () => {
    setShowExpiredShortPositions(!showExpiredShortPositions);
  }

  const handleShowActiveLongPositionDetails = (i: number) => {
    setActiveLongPositionModalIndex(i);
    setShowActiveLongPositionModal(true);
  }

  const handleShowActiveShortPositionDetails = (i: number) => {
    setActiveShortPositionModalIndex(i);
    setShowActiveShortPositionModal(true);
  }

  const handleShowExpiredLongPositionDetails = (i: number) => {
    setExpiredLongPositionModalIndex(i);
    setShowExpiredLongPositionModal(true);
  }

  const handleShowExpiredShortPositionDetails = (i: number) => {
    setExpiredShortPositionModalIndex(i);
    setShowExpiredShortPositionModal(true);
  }

  const classes = useStyles();

  const previousOpenOrdersCount = usePrevious(openOrdersMetadata.length);
  const previousActiveLongPositionsCount = usePrevious(activeLongPositions.length);
  const previousActiveShortPositionsCount = usePrevious(activeShortPositions.length);

  const previousExpiredLongPositionsCount = usePrevious(expiredLongPositions.length);
  const previousExpiredShortPositionsCount = usePrevious(expiredShortPositions.length);

  useEffect(() => {
    let isCancelled = false;
    const loadPortfolioData = async () => {
      setIsLoading(true);
      try {
        await refreshPortfolio();
        // !isCancelled &&
        //   setCollateralForWithdraw(settledPositionsToWithdraw.reduce((total: Number, contract: any) => total += contract?.finalReward, 0));
      } catch (error) {

      }
      setIsLoading(false);
    }
    loadPortfolioData()
    return () => {
      isCancelled = true;
    }
  }, [address])

  useEffect(() => {
    ((previousOpenOrdersCount === 0 || !previousOpenOrdersCount) && openOrdersMetadata.length > 0)
      && setShowOpenOrders(true);
    ((previousActiveLongPositionsCount === 0 || !previousActiveLongPositionsCount) && activeLongPositions.length > 0)
      && setShowActiveLongPositions(true);
    ((previousActiveShortPositionsCount === 0 || !previousActiveShortPositionsCount) && activeShortPositions.length > 0)
      && setShowActiveShortPositions(true);
    ((previousExpiredLongPositionsCount === 0 || !previousExpiredLongPositionsCount) && expiredLongPositions.length > 0)
      && setShowExpiredLongPositions(true);
    ((previousActiveShortPositionsCount === 0 || !previousActiveShortPositionsCount) && expiredShortPositions.length > 0)
      && setShowExpiredShortPositions(true);

    (previousOpenOrdersCount > 0 && openOrdersMetadata.length === 0) && setShowOpenOrders(false);
    (previousActiveLongPositionsCount > 0 && activeLongPositions.length === 0) && setShowActiveLongPositions(false);
    (previousActiveShortPositionsCount > 0 && activeShortPositions.length === 0) && setShowActiveShortPositions(false);
    (previousExpiredLongPositionsCount > 0 && expiredLongPositions.length === 0) && setShowExpiredLongPositions(false);
    (previousExpiredShortPositionsCount > 0 && expiredShortPositions.length === 0) && setShowExpiredShortPositions(false);
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
    expiredShortPositions,
  ])

  useEffect(() => {
    const collateralAvailableToWithdraw = expiredLongPositions.concat(expiredShortPositions)
      .filter(p => p.status === PositionStatus.withdrawalPending)
      .reduce((total: Number, position: any) => total += position?.finalReward, 0)
    setCollateralForWithdraw(collateralAvailableToWithdraw);
  }, [expiredLongPositions, expiredShortPositions])

  return (
    <>
      <Grid container>
        <Grid item xs={12}>
          <Typography variant='h5' style={{ fontWeight: 'bold', textAlign: 'center' }} color='secondary'>Portfolio</Typography>
        </Grid>
        <Grid item xs={12}>
          <Tabs
            value={activeTab}
            onChange={handleSetActiveTab}
            indicatorColor="secondary"
            textColor="secondary"
            variant='fullWidth'>
            <Tab label="Active" value='active' />
            <Tab label="Expired" value='expired' />
          </Tabs>
          <div className={classes.tabContent}>
            {activeTab === 'active' ?
              <>
                <ExpansionPanel expanded={showOpenOrders}>
                  <ExpansionPanelSummary
                    expandIcon={!isLoading ? <ExpandMore /> : <CircularProgress className={classes.loadingSpinner} size={20} />}
                    classes={{
                      content: classes.sectionHeading
                    }}
                    IconButtonProps={{ onClick: handleToggleOpenOrdersPanel }}>
                    <Typography variant='h5' className={classes.sectionHeadingText}>
                      Unfilled Positions (Open Orders)
                  </Typography>
                    <ButtonBase className={classes.infoButton}><InfoRounded /></ButtonBase>
                  </ExpansionPanelSummary>
                  <ExpansionPanelDetails>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Price ($/TH/Day)</TableCell>
                          <TableCell align='center'>Duration (Days)</TableCell>
                          <TableCell align='center'>Quantity (TH)</TableCell>
                          <TableCell align='center'>Listing Date</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {openOrdersMetadata && openOrdersMetadata?.map(order =>
                          <TableRow key={order.orderHash}>
                            <TableCell>${order?.price.dividedBy(CONTRACT_DURATION).toFixed(2)}</TableCell>
                            <TableCell align='center'>{CONTRACT_DURATION} days</TableCell>
                            <TableCell align='center'>{order?.remainingFillableMakerAssetAmount.toLocaleString()}</TableCell>
                            <TableCell align='center'>TBC</TableCell>
                            <TableCell align='right'>
                              <Button onClick={() => cancelOpenOrder(order.orderHash)} disabled={isCancelling}>
                                Cancel&nbsp;
                              {isCancelling && <CircularProgress className={classes.loadingSpinner} size={20} />}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )}
                        {!isLoading && openOrdersMetadata.length === 0 &&
                          <TableRow>
                            <TableCell colSpan={5} align='center' className={classes.placeholderRow}>
                              No Unfilled Positions (Open Orders)
                          </TableCell>
                          </TableRow>
                        }
                      </TableBody>
                    </Table>
                  </ExpansionPanelDetails>
                </ExpansionPanel>
                <Divider className={classes.sectionDivider} light variant='middle' />
                <ExpansionPanel expanded={showActiveLongPositions}>
                  <ExpansionPanelSummary
                    expandIcon={!isLoading ? <ExpandMore /> : <CircularProgress className={classes.loadingSpinner} size={20} />}
                    classes={{
                      content: classes.sectionHeading
                    }}
                    IconButtonProps={{ onClick: handleToggleActiveLongPositionsPanel }}>
                    <Typography variant='h5' className={classes.sectionHeadingText}>
                      Long Positions (Filled Buy Order)
                  </Typography>
                    <ButtonBase className={classes.infoButton}><InfoRounded /></ButtonBase>
                  </ExpansionPanelSummary>
                  <ExpansionPanelDetails>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Settlement Date</TableCell>
                          <TableCell align='center'>Days till Expiration</TableCell>
                          <TableCell align='center'>Cost ({PAYMENT_TOKEN_NAME})</TableCell>
                          <TableCell align='center'>Receivable ({COLLATERAL_TOKEN_NAME})</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activeLongPositions && activeLongPositions?.map((position: any, i) =>
                          <TableRow key={i}>
                            <TableCell>{dayjs(position.settlementDate).format('DD-MMM-YY')}</TableCell>
                            <TableCell align='center'>
                              <TimeRemaining totalDuration={CONTRACT_DURATION} remainingDuration={position.daysToExpiration} unitLabel='d' />
                            </TableCell>
                            <TableCell align='center'>{position.totalCost}</TableCell>
                            <TableCell align='center'>{position.pendingReward}</TableCell>
                            <TableCell align='right'><Info onClick={() => handleShowActiveLongPositionDetails(i)} /></TableCell>
                          </TableRow>
                        )}
                        {!isLoading && activeLongPositions.length === 0 &&
                          <TableRow>
                            <TableCell colSpan={5} align='center' className={classes.placeholderRow}>
                              No Active Long Positions
                          </TableCell>
                          </TableRow>
                        }
                      </TableBody>
                    </Table>
                  </ExpansionPanelDetails>
                </ExpansionPanel>
                <Divider className={classes.sectionDivider} light variant='middle' />
                <ExpansionPanel expanded={showActiveShortPositions}>
                  <ExpansionPanelSummary
                    expandIcon={!isLoading ? <ExpandMore /> : <CircularProgress className={classes.loadingSpinner} size={20} />}
                    classes={{
                      content: classes.sectionHeading
                    }}
                    IconButtonProps={{ onClick: handleToggleActiveShortPositionsPanel }}>
                    <Typography variant='h5' className={classes.sectionHeadingText}>
                      Short Positions (Filled Offers)
                  </Typography>
                    <ButtonBase className={classes.infoButton}><InfoRounded /></ButtonBase>
                  </ExpansionPanelSummary>
                  <ExpansionPanelDetails>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Settlement Date</TableCell>
                          <TableCell align='center'>Days till Expiration</TableCell>
                          <TableCell align='center'>Received ({PAYMENT_TOKEN_NAME})</TableCell>
                          <TableCell align='center'>Collateral Locked ({COLLATERAL_TOKEN_NAME})</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activeShortPositions && activeShortPositions?.map((position: any, i) =>
                          <TableRow key={i}>
                            <TableCell>{dayjs(position.settlementDate).format('DD-MMM-YY')}</TableCell>
                            <TableCell align='center'>
                              <TimeRemaining totalDuration={CONTRACT_DURATION} remainingDuration={position.daysToExpiration} unitLabel='d' />
                            </TableCell>
                            <TableCell align='center'>{position.totalCost.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}</TableCell>
                            <TableCell align='center'>{position.totalCollateralLocked.toLocaleString(undefined, { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS })}</TableCell>
                            <TableCell align='right'><Info onClick={() => handleShowActiveShortPositionDetails(i)} /></TableCell>
                          </TableRow>
                        )}
                        {!isLoading && activeShortPositions.length === 0 &&
                          <TableRow>
                            <TableCell colSpan={5} align='center' className={classes.placeholderRow}>
                              No Active Long Positions
                          </TableCell>
                          </TableRow>
                        }
                      </TableBody>
                    </Table>
                  </ExpansionPanelDetails>
                </ExpansionPanel>
              </> :
              <>
                <ExpansionPanel expanded={showPendingWithdraw}>
                  <ExpansionPanelSummary
                    expandIcon={!isLoading ? <ExpandMore /> : <CircularProgress className={classes.loadingSpinner} size={20} />}
                    classes={{
                      content: classes.sectionHeading
                    }}
                    IconButtonProps={{ onClick: handleTogglePendingWithdrawPanel }}>
                    <Typography variant='h5' className={classes.sectionHeadingText}>
                      Pending Withdrawal
                    </Typography>
                    <ButtonBase className={classes.infoButton}><InfoRounded /></ButtonBase>
                  </ExpansionPanelSummary>
                  <ExpansionPanelDetails>
                    <Grid container>
                      <Grid item xs={12} style={{ paddingTop: 8 }}>
                        <Button fullWidth disabled={collateralForWithdraw === 0} onClick={withdrawAllAvailable}>
                          {(!isWithdrawing) ?
                            (collateralForWithdraw > 0) ?
                              `WITHDRAW ALL (${collateralForWithdraw.toLocaleString()} ${COLLATERAL_TOKEN_NAME})` :
                              <>WITHDRAW ALL <RadioButtonUnchecked className={classes.icon} /></> :
                            <>WITHDRAW ALL <CircularProgress className={classes.loadingSpinner} size={20} /></>
                          }
                        </Button>
                      </Grid>
                    </Grid>
                  </ExpansionPanelDetails>
                </ExpansionPanel>
                <Divider className={classes.sectionDivider} light variant='middle' />
                <ExpansionPanel expanded={showExpiredLongPositions}>
                  <ExpansionPanelSummary
                    expandIcon={!isLoading ? <ExpandMore /> : <CircularProgress className={classes.loadingSpinner} size={20} />}
                    classes={{
                      content: classes.sectionHeading
                    }}
                    IconButtonProps={{ onClick: handleToggleExpiredLongPositionsPanel }}>
                    <Typography variant='h5' className={classes.sectionHeadingText}>
                      Long Positions (Filled Buy Order)
                  </Typography>
                    <ButtonBase className={classes.infoButton}><InfoRounded /></ButtonBase>
                  </ExpansionPanelSummary>
                  <ExpansionPanelDetails>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Settlement Date</TableCell>
                          <TableCell align='center'>Cost ({PAYMENT_TOKEN_NAME})</TableCell>
                          <TableCell align='center'>Received ({COLLATERAL_TOKEN_NAME})</TableCell>
                          <TableCell align='right'>Status</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {expiredLongPositions && expiredLongPositions?.map((position: any, i) =>
                          <TableRow key={i}>
                            <TableCell>{dayjs(position.settlementDate).format('DD-MMM-YY')}</TableCell>
                            <TableCell align='center'>{position.totalCost.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}</TableCell>
                            <TableCell align='center'>{position.finalReward}</TableCell>
                            <TableCell align='center'>{position.status}</TableCell>
                            <TableCell align='right'><Info onClick={() => handleShowExpiredLongPositionDetails(i)} /></TableCell>
                          </TableRow>
                        )}
                        {!isLoading && expiredLongPositions.length === 0 &&
                          <TableRow>
                            <TableCell colSpan={5} align='center' className={classes.placeholderRow}>
                              No Expired Long Positions
                          </TableCell>
                          </TableRow>
                        }
                      </TableBody>
                    </Table>
                  </ExpansionPanelDetails>
                </ExpansionPanel>
                <Divider className={classes.sectionDivider} light variant='middle' />
                <ExpansionPanel expanded={showExpiredShortPositions}>
                  <ExpansionPanelSummary
                    expandIcon={!isLoading ? <ExpandMore /> : <CircularProgress className={classes.loadingSpinner} size={20} />}
                    classes={{
                      content: classes.sectionHeading
                    }}
                    IconButtonProps={{ onClick: handleToggleExpiredShortPositionsPanel }}>
                    <Typography variant='h5' className={classes.sectionHeadingText}>
                      Short Positions (Filled Offers)
                  </Typography>
                    <ButtonBase className={classes.infoButton}><InfoRounded /></ButtonBase>
                  </ExpansionPanelSummary>
                  <ExpansionPanelDetails>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Settlement Date</TableCell>
                          <TableCell align='center'>Received </TableCell>
                          <TableCell align='center'>Paid</TableCell>
                          <TableCell align='center'>Status</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {expiredShortPositions && expiredShortPositions?.map((position: any, i) =>
                          <TableRow key={i}>
                            <TableCell>{dayjs(position.settlementDate).format('DD-MMM-YY')}</TableCell>
                            <TableCell align='center'>{position.totalCost.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}</TableCell>
                            <TableCell align='center'>{(position.totalCollateralLocked - position.finalReward).toLocaleString(undefined, { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS })}</TableCell>
                            <TableCell align='center'>{position.status}</TableCell>
                            <TableCell align='right'><Info onClick={() => handleShowExpiredShortPositionDetails(i)} /></TableCell>
                          </TableRow>
                        )}
                        {!isLoading && activeShortPositions.length === 0 &&
                          <TableRow>
                            <TableCell colSpan={6} align='center' className={classes.placeholderRow}>
                              No Expired Short Positions
                              </TableCell>
                          </TableRow>
                        }
                      </TableBody>
                    </Table>
                  </ExpansionPanelDetails>
                </ExpansionPanel>
              </>
            }
          </div>
        </Grid>
      </Grid >
      {activeLongPositionModalIndex > -1 &&
        <ActiveLongPositionModal
          open={showActiveLongPositionModal}
          onClose={() => setShowActiveLongPositionModal(false)}
          position={activeLongPositions[activeLongPositionModalIndex]} />
      }
      {activeShortPositionModalIndex > -1 &&
        <ActiveShortPositionModal
          open={showActiveShortPositionModal}
          onClose={() => setShowActiveShortPositionModal(false)}
          position={activeShortPositions[activeShortPositionModalIndex]} />
      }
      {expiredLongPositionModalIndex > -1 &&
        <ExpiredLongPositionModal
          open={showExpiredLongPositionModal}
          onClose={() => setShowExpiredLongPositionModal(false)}
          position={expiredLongPositions[expiredLongPositionModalIndex]} />
      }
      {expiredShortPositionModalIndex > -1 &&
        <ExpiredShortPositionModal
          open={showExpiredShortPositionModal}
          onClose={() => setShowExpiredShortPositionModal(false)}
          position={expiredShortPositions[expiredShortPositionModalIndex]} />
      }
    </>
  )
}

export default PorfolioPage;
