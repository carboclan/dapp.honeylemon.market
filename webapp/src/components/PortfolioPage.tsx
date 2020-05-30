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
  CircularProgress
} from '@material-ui/core';
import { RadioButtonUnchecked } from '@material-ui/icons';
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
      const results = await honeylemonService.batchRedeem(address);
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

        const activePositions = allPositions.filter((p: any) => !p?.contract.settlement)
        setActivePositions(activePositions);
        const sctw = allPositions.filter((p: any) => !!p?.contract.settlement /** &&  available withdraw flag */)
        setSettledPositionsToWithdraw(sctw);
        setCollateralForWithdraw(sctw.reduce((total: Number, contract: any) => total += contract?.finalReward, 0));
        const finalized = allPositions.filter((p: any) => !!p?.contract.settlement /** &&  !available withdraw flag */)
        setSettledPositions(finalized);
        setRefresh(false);
        setIsLoading(false)
      }
    }
    getPorfolio()
    return () => { cancelled = true }
  }, [address, honeylemonService, refresh, CONTRACT_DURATION])

  useEffect(() => {
    var poller: NodeJS.Timeout;
    poller = setInterval(() => setRefresh(true), 5000);

    return () => {
      clearInterval(poller)
    }
  }, [])

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
              <Typography variant='h5' className={classes.sectionHeading}>
                Unfilled Positions
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Price</TableCell>
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
                  <TableRow>
                    <TableCell colSpan={3} align='center' className={classes.placeholderRow}>
                      {isLoading && <CircularProgress className={classes.loadingSpinner} size={20} />}
                      {!isLoading && openOrdersMetadata.length === 0 && "No open positions"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Divider className={classes.sectionDivider} light variant='middle' />
              <Typography variant='h5' className={classes.sectionHeading}>
                Positions
                </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Swap</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Days</TableCell>
                    <TableCell align='right'>BTC Accrued</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activePositions && activePositions?.map((position: any, i) =>
                    <TableRow key={i}>
                      <TableCell>{position.contractName}</TableCell>
                      <TableCell align='center'>{position?.qtyToMint}</TableCell>
                      <TableCell>{position.daysToMaturity}</TableCell>
                      <TableCell>{position.pendingReward}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={4} align='center' className={classes.placeholderRow}>
                      {isLoading && <CircularProgress className={classes.loadingSpinner} size={20} />}
                      {!isLoading && activePositions.length === 0 && "No active positions"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </> :
            <>
              <Typography variant='h5' className={classes.sectionHeading}>Withdraw Pending</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Swap</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>BTC</TableCell>
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
                  <TableRow>
                    <TableCell colSpan={3} align='center' className={classes.placeholderRow}>
                      {isLoading && <CircularProgress className={classes.loadingSpinner} size={20} />}
                      {!isLoading && settledPositionsToWithdraw.length === 0 && "No open positions"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Button fullWidth disabled={collateralForWithdraw === 0} onClick={withdrawAvailable}>
                {(!isWithdrawing) ?
                  (collateralForWithdraw > 0) ?
                    `WITHDRAW ALL (${collateralForWithdraw} BTC)` :
                    <>WITHDRAW ALL <RadioButtonUnchecked className={classes.icon} /></> :
                  <>WITHDRAW ALL <CircularProgress className={classes.loadingSpinner} size={20} /></>
                }
              </Button>
              <Divider className={classes.sectionDivider} light variant='middle' />
              <Typography variant='h5' className={classes.sectionHeading}>Closed</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Swap</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>BTC</TableCell>
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
                  <TableRow>
                    <TableCell colSpan={3} align='center' className={classes.placeholderRow}>
                      {isLoading && <CircularProgress className={classes.loadingSpinner} size={20} />}
                      {!isLoading && settledPositions.length === 0 && "No open positions"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </>
          }
        </div>
      </Grid>
    </Grid>
  )
}

export default PorfolioPage;
