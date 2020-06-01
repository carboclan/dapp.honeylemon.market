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
  ExpansionPanelDetails
} from '@material-ui/core';
import { ExpandMore, RadioButtonUnchecked } from '@material-ui/icons';
import { useOnboard } from '../contexts/OnboardContext';
import { useHoneylemon } from '../contexts/HoneylemonContext';

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
  sectionHeading: {
    fontWeight: 'bold',
    color: palette.secondary.main,
  },
  placeholderRow: {
    height: 60,
  }
}))

const PorfolioPage: React.SFC = () => {
  const { address } = useOnboard();
  const { honeylemonService, CONTRACT_DURATION, COLLATERAL_TOKEN_DECIMALS } = useHoneylemon();

  const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active')
  const [collateralForWithdraw, setCollateralForWithdraw] = useState<Number>(0);
  const [openOrdersMetadata, setOpenOrdersMetadata] = useState<
    Array<{
      orderHash: string,
      remainingFillableMakerAssetAmount: BigNumber,
      price: BigNumber
      //TODO: update to use types once definitions have been added
    }>>([]);

  const [openOrders, setOpenOrders] = useState<{
    [orderHash: string]: {
      makerAddress: string;
      takerAddress: string;
      feeRecipientAddress: string;
      senderAddress: string;
      makerAssetAmount: BigNumber;
      takerAssetAmount: BigNumber;
      makerFee: BigNumber;
      takerFee: BigNumber;
      expirationTimeSeconds: BigNumber;
      salt: BigNumber;
      makerAssetData: string;
      takerAssetData: string;
      makerFeeAssetData: string;
      takerFeeAssetData: string;
    }
  } | undefined>()
  const [activePositions, setActivePositions] = useState([]);
  const [settledPositionsToWithdraw, setSettledPositionsToWithdraw] = useState([]);
  const [settledPositions, setSettledPositions] = useState([]);
  const [refresh, setRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showOpenOrders, setShowOpenOrders] = useState(false);
  const [showActivePositions, setShowActivePositions] = useState(false);
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

    await honeylemonService.getCancelOrderTx(order)
      .awaitTransactionSuccessAsync({
        from: address,
        gas: 1500000
      })
      .then(() => setRefresh(true));
  }

  const withdrawAvailable = async () => {
    setIsWithdrawing(true);
    try {
      //const results = 
      await honeylemonService.batchRedeem(address);
      setRefresh(true);
    } catch (error) {
      console.log("Something went wrong during the withdrawl");
      console.log(error);
    }
    setIsWithdrawing(false);
  }

  useEffect(() => {
    let cancelled = false;

    const getPorfolio = async () => {
      setIsLoading(true);
      const openOrdersRes = await honeylemonService.getOpenOrders(address);
      const positions = await honeylemonService.getPositions(address);
      if (!cancelled) {
        setOpenOrdersMetadata(openOrdersRes.records.map((openOrder: any) => openOrder.metaData))
        !showOpenOrders && setShowOpenOrders(openOrdersRes.records.length > 0);
        setOpenOrders(Object.fromEntries(
          openOrdersRes.records.map(((openOrder: any) => [openOrder.metaData.orderHash, openOrder.order]))
        ));

        const allPositions = positions.longPositions.map((lp: any) => ({
          ...lp,
          contractName: lp.contractName + '-long',
        })).concat(positions.shortPositions.map((sp: any) => ({
          ...sp,
          contractName: sp.contractName + '-short',
        }))).map((p: any) => ({
          ...p,
          daysToMaturity: Math.ceil(dayjs(p.contract.expiration * 1000).diff(dayjs(), 'd', true)),
          pendingReward: Number(p.pendingReward?.shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString()) || 0,
          finalReward: Number(p.finalReward?.shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString()) || 0,
        }));

        const newActivePositions = allPositions.filter((p: any) => !p?.contract.settlement)
        setActivePositions(newActivePositions);
        !showActivePositions && setShowActivePositions(newActivePositions.length > 0)

        const sptw = allPositions.filter((p: any) => !!p?.contract.settlement /** &&  available withdraw flag */)
        setSettledPositionsToWithdraw(sptw);
        !showSettledPositionsToWithdraw && setShowSettledPositionsToWithdraw(sptw.length > 0)
        setCollateralForWithdraw(sptw.reduce((total: Number, contract: any) => total += contract?.finalReward, 0));

        const finalized = allPositions.filter((p: any) => !!p?.contract.settlement /** &&  !available withdraw flag */)
        setSettledPositions(finalized);
        !showSettledPositions && setShowSettledPositions(finalized.length > 0)

        setRefresh(false);
        setIsLoading(false)
      }
    }
    getPorfolio()
    return () => { cancelled = true }
  }, [address, honeylemonService, refresh, CONTRACT_DURATION, COLLATERAL_TOKEN_DECIMALS])

  useEffect(() => {
    var poller: NodeJS.Timeout;
    poller = setInterval(() => setRefresh(true), 5000);

    return () => {
      clearInterval(poller)
    }
  }, [])

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

  const classes = useStyles();
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
                  id="unfilled-panel-header">
                  <Typography variant='h5' className={classes.sectionHeading}>
                    Unfilled Positions
                  </Typography>
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
                          <TableCell align='right'><Button onClick={() => cancelOpenOrder(order.orderHash)}>Cancel</Button></TableCell>
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
                  id="active-orders-panel-header">
                  <Typography variant='h5' className={classes.sectionHeading}>
                    Positions
                  </Typography>
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
              <ExpansionPanel expanded={showSettledPositionsToWithdraw} onClick={handleToggleSettledPositionsToWithdrawPanel}>
                <ExpansionPanelSummary
                  expandIcon={!isLoading ? <ExpandMore /> : <CircularProgress className={classes.loadingSpinner} size={20} />}
                  aria-controls="settled-orders-withdraw-panel-content"
                  id="settled-orders-withdraw-panel-header">
                  <Typography variant='h5' className={classes.sectionHeading}>Withdraw Pending</Typography>
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
                      <Button fullWidth disabled={collateralForWithdraw === 0} onClick={withdrawAvailable}>
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
                  id="settled-orders-panel-header">
                  <Typography variant='h5' className={classes.sectionHeading}>Closed</Typography>
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
