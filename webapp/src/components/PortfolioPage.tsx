import React, { useState, useEffect } from 'react';
import { BigNumber } from '@0x/utils';
import dayjs from 'dayjs';
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
  ButtonBase
} from '@material-ui/core';
import { ExpandMore, RadioButtonUnchecked, InfoRounded } from '@material-ui/icons';
import { useOnboard } from '../contexts/OnboardContext';
import { useHoneylemon, OpenOrder } from '../contexts/HoneylemonContext';
import { usePrevious } from '../helpers/usePrevious';

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

const PorfolioPage: React.SFC = () => {
  const { address } = useOnboard();
  const { honeylemonService, CONTRACT_DURATION, refreshPortfolio, portfolioData } = useHoneylemon();

  const {
    openOrders,
    openOrdersMetadata,
    activePositions,
    settlementDelayPositions,
    settledPositionsToWithdraw,
    settledPositions
  } = portfolioData;

  const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active')
  const [collateralForWithdraw, setCollateralForWithdraw] = useState<Number>(0);

  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOpenOrders, setShowOpenOrders] = useState(false);
  const [showActivePositions, setShowActivePositions] = useState(false);
  const [showSettlementDelayPositions, setShowSettlementDelayPositions] = useState(false);
  const [showSettledPositionsToWithdraw, setShowSettledPositionsToWithdraw] = useState(false);
  const [showSettledPositions, setShowSettledPositions] = useState(false);

  const handleSetActiveTab = (event: React.ChangeEvent<{}>, newValue: 'active' | 'settled') => {
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

  const handleToggleActivePositionsPanel = () => {
    setShowActivePositions(!showActivePositions);
  }

  const handleToggleSettledPositionsToWithdrawPanel = () => {
    setShowSettledPositionsToWithdraw(!showSettledPositionsToWithdraw);
  }

  const handleToggleSettledPositionsPanel = () => {
    setShowSettledPositions(!showSettledPositions);
  }

  const handleToggleSettlementDelayPositionsPanel = () => {
    setShowSettlementDelayPositions(!showSettlementDelayPositions);
  }

  const classes = useStyles();

  const previousOpenOrdersCount = usePrevious(openOrdersMetadata.length);
  const previousActivePositionsCount = usePrevious(activePositions.length);
  const previousSettlementDelayPositionsCount = usePrevious(settlementDelayPositions.length);
  const previousSettledPositionsToWithdrawCount = usePrevious(settledPositionsToWithdraw.length);
  const previousSettledPositionsCount = usePrevious(settledPositions.length);

  useEffect(() => {
    const loadPortfolioData = async () => {
      setIsLoading(true);
      await refreshPortfolio();
      setCollateralForWithdraw(settledPositionsToWithdraw.reduce((total: Number, contract: any) => total += contract?.finalReward, 0));
      setIsLoading(false);
    }
    loadPortfolioData()
  }, [address])

  useEffect(() => {
    (previousOpenOrdersCount === 0 && openOrdersMetadata.length > 0) && setShowOpenOrders(true);
    (previousActivePositionsCount === 0 && activePositions.length > 0) && setShowActivePositions(true);
    (previousSettlementDelayPositionsCount === 0 && settlementDelayPositions.length > 0) && setShowSettlementDelayPositions(true);
    (previousSettledPositionsToWithdrawCount === 0 && settledPositionsToWithdraw.length > 0) && setShowSettledPositionsToWithdraw(true);
    (previousSettledPositionsCount === 0 && settledPositions.length > 0) && setShowSettledPositions(true);

    (previousOpenOrdersCount > 0 && openOrdersMetadata.length === 0) && setShowOpenOrders(false);
    (previousActivePositionsCount > 0 && activePositions.length === 0) && setShowActivePositions(false);
    (previousSettlementDelayPositionsCount > 0 && settlementDelayPositions.length === 0) && setShowSettlementDelayPositions(false);
    (previousSettledPositionsToWithdrawCount > 0 && settledPositionsToWithdraw.length === 0) && setShowSettledPositionsToWithdraw(false);
    (previousSettledPositionsCount > 0 && settledPositions.length === 0) && setShowSettledPositions(false);
  })

  useEffect(() => {
    setCollateralForWithdraw(settledPositionsToWithdraw.reduce((total: Number, contract: any) => total += contract?.finalReward, 0));
  }, [settledPositionsToWithdraw])

  return (
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
          <Tab label="Settled" value='settled' />
        </Tabs>
        <div className={classes.tabContent}>
          {activeTab === 'active' ?
            <>
              <ExpansionPanel expanded={showOpenOrders} onClick={handleToggleOpenOrdersPanel}>
                <ExpansionPanelSummary
                  expandIcon={!isLoading ? <ExpandMore /> : <CircularProgress className={classes.loadingSpinner} size={20} />}
                  aria-controls="unfilled-panel-content"
                  id="unfilled-panel-header"
                  classes={{
                    content: classes.sectionHeading
                  }}>
                  <Typography variant='h5' className={classes.sectionHeadingText}>
                    Unfilled Positions
                  </Typography>
                  <ButtonBase className={classes.infoButton}><InfoRounded /></ButtonBase>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Quantity</TableCell>
                        <TableCell align='center'>Price</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {openOrdersMetadata && openOrdersMetadata?.map(order =>
                        <TableRow key={order.orderHash}>
                          <TableCell>{order?.remainingFillableMakerAssetAmount.toString()}</TableCell>
                          <TableCell align='center'>${order?.price.dividedBy(CONTRACT_DURATION).toFixed(2)}</TableCell>
                          <TableCell align='right'>
                            <Button onClick={() => cancelOpenOrder(order.orderHash)} disabled={!isCancelling}>
                              Cancel&nbsp;
                              {isCancelling && <CircularProgress className={classes.loadingSpinner} size={20} />}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                      {!isLoading && openOrdersMetadata.length === 0 &&
                        <TableRow>
                          <TableCell colSpan={3} align='center' className={classes.placeholderRow}>
                            No open positions
                          </TableCell>
                        </TableRow>
                      }
                    </TableBody>
                  </Table>
                </ExpansionPanelDetails>
              </ExpansionPanel>
              <Divider className={classes.sectionDivider} light variant='middle' />
              <ExpansionPanel expanded={showActivePositions} onClick={handleToggleActivePositionsPanel}>
                <ExpansionPanelSummary
                  expandIcon={!isLoading ? <ExpandMore /> : <CircularProgress className={classes.loadingSpinner} size={20} />}
                  aria-controls="active-orders-panel-content"
                  id="active-orders-panel-header"
                  classes={{
                    content: classes.sectionHeading
                  }}>
                  <Typography variant='h5' className={classes.sectionHeadingText}>
                    Positions
                  </Typography>
                  <ButtonBase className={classes.infoButton}><InfoRounded /></ButtonBase>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Swap</TableCell>
                        <TableCell align='center'>Quantity</TableCell>
                        <TableCell align='center'>Days</TableCell>
                        <TableCell align='right'>BTC</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activePositions && activePositions?.map((position: any, i) =>
                        <TableRow key={i}>
                          <TableCell>{position.contractName}</TableCell>
                          <TableCell align='center'>{position.qtyToMint}</TableCell>
                          <TableCell align='center'>{position.daysToMaturity}</TableCell>
                          <TableCell align='right'>{position.pendingReward}</TableCell>
                        </TableRow>
                      )}
                      {!isLoading && activePositions.length === 0 &&
                        <TableRow>
                          <TableCell colSpan={4} align='center' className={classes.placeholderRow}>
                            No active positions
                          </TableCell>
                        </TableRow>
                      }
                    </TableBody>
                  </Table>
                </ExpansionPanelDetails>
              </ExpansionPanel>
            </> :
            <>
              <ExpansionPanel expanded={showSettlementDelayPositions} onClick={handleToggleSettlementDelayPositionsPanel}>
                <ExpansionPanelSummary
                  expandIcon={!isLoading ? <ExpandMore /> : <CircularProgress className={classes.loadingSpinner} size={20} />}
                  aria-controls="settled-orders-withdraw-panel-content"
                  id="settled-orders-withdraw-panel-header"
                  classes={{
                    content: classes.sectionHeading
                  }}>
                  <Typography variant='h5' className={classes.sectionHeadingText}>Awaiting Settlement Delay Expiry</Typography>
                  <ButtonBase className={classes.infoButton}><InfoRounded /></ButtonBase>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                  <Grid container direction='row' spacing={2}>
                    <Grid item xs={12}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Swap</TableCell>
                            <TableCell align='center'>Position</TableCell>
                            <TableCell align='right'>BTC</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {settlementDelayPositions?.map((position: any, i) =>
                            <TableRow key={i}>
                              <TableCell>{position.contractName}</TableCell>
                              <TableCell align='center'>{position.qtyToMint}</TableCell>
                              <TableCell align='right'>{position.finalReward}</TableCell>
                            </TableRow>
                          )}
                          {!isLoading && settlementDelayPositions.length === 0 &&
                            <TableRow>
                              <TableCell colSpan={3} align='center' className={classes.placeholderRow}>
                                No positions awaiting settlement delay expiry
                              </TableCell>
                            </TableRow>
                          }
                        </TableBody>
                      </Table>
                    </Grid>
                  </Grid>
                </ExpansionPanelDetails>
              </ExpansionPanel>
              <Divider className={classes.sectionDivider} light variant='middle' />
              <ExpansionPanel expanded={showSettledPositionsToWithdraw} onClick={handleToggleSettledPositionsToWithdrawPanel}>
                <ExpansionPanelSummary
                  expandIcon={!isLoading ? <ExpandMore /> : <CircularProgress className={classes.loadingSpinner} size={20} />}
                  aria-controls="settled-orders-withdraw-panel-content"
                  id="settled-orders-withdraw-panel-header"
                  classes={{
                    content: classes.sectionHeading
                  }}>
                  <Typography variant='h5' className={classes.sectionHeadingText}>Withdraw Pending</Typography>
                  <ButtonBase className={classes.infoButton}><InfoRounded /></ButtonBase>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                  <Grid container direction='row' spacing={2}>
                    <Grid item xs={12}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Swap</TableCell>
                            <TableCell align='center'>Position</TableCell>
                            <TableCell align='right'>BTC</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {settledPositionsToWithdraw?.map((position: any, i) =>
                            <TableRow key={i}>
                              <TableCell>{position.contractName}</TableCell>
                              <TableCell align='center'>{position.qtyToMint}</TableCell>
                              <TableCell align='right'>{position.finalReward}</TableCell>
                            </TableRow>
                          )}
                          {!isLoading && settledPositionsToWithdraw.length === 0 &&
                            <TableRow>
                              <TableCell colSpan={3} align='center' className={classes.placeholderRow}>
                                No positions to withdraw
                              </TableCell>
                            </TableRow>
                          }
                        </TableBody>
                      </Table>
                    </Grid>
                    <Grid item xs={12}>
                      <Button fullWidth disabled={collateralForWithdraw === 0} onClick={withdrawAllAvailable}>
                        {(!isWithdrawing) ?
                          (collateralForWithdraw > 0) ?
                            `WITHDRAW ALL (${collateralForWithdraw.toLocaleString()} BTC)` :
                            <>WITHDRAW ALL <RadioButtonUnchecked className={classes.icon} /></> :
                          <>WITHDRAW ALL <CircularProgress className={classes.loadingSpinner} size={20} /></>
                        }
                      </Button>
                    </Grid>
                  </Grid>
                </ExpansionPanelDetails>
              </ExpansionPanel>
              <Divider className={classes.sectionDivider} light variant='middle' />
              <ExpansionPanel expanded={showSettledPositions} onClick={handleToggleSettledPositionsPanel}>
                <ExpansionPanelSummary
                  expandIcon={!isLoading ? <ExpandMore /> : <CircularProgress className={classes.loadingSpinner} size={20} />}
                  aria-controls="settled-orders-panel-content"
                  id="settled-orders-panel-header"
                  classes={{
                    content: classes.sectionHeading
                  }}>
                  <Typography variant='h5' className={classes.sectionHeadingText}>Settled & Withdrawn</Typography>
                  <ButtonBase className={classes.infoButton}><InfoRounded /></ButtonBase>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Swap</TableCell>
                        <TableCell align='center'>Position</TableCell>
                        <TableCell align='right'>BTC</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {settledPositions.map((position: any, i) =>
                        <TableRow key={i}>
                          <TableCell>{position.contractName}</TableCell>
                          <TableCell align='center'>{position.qtyToMint}</TableCell>
                          <TableCell align='right'>{position.finalReward}</TableCell>
                        </TableRow>
                      )}
                      {!isLoading && settledPositions.length === 0 &&
                        <TableRow>
                          <TableCell colSpan={3} align='center' className={classes.placeholderRow}>
                            No closed positions
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
    </Grid>
  )
}

export default PorfolioPage;
