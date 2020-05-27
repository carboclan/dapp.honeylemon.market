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
  Divider
} from '@material-ui/core';
import { RadioButtonUnchecked } from '@material-ui/icons';
import { useOnboard } from '../contexts/OnboardContext';
import { useHoneylemon } from '../contexts/HoneylemonContext';

const useStyles = makeStyles(({ spacing }) => ({
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
  }
}))

const PorfolioPage: React.SFC = () => {
  const { address } = useOnboard();
  const { honeylemonService, CONTRACT_DURATION } = useHoneylemon();

  const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active')
  const [collateralForWithdraw, setCollateralForWithdraw] = useState(0);
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

  useEffect(() => {
    let cancelled = false;

    const getPorfolio = async () => {

      const openOrdersRes = await honeylemonService.getOpenOrders(address);
      const positions = await honeylemonService.getPositions(address);
      if (!cancelled) {
        setOpenOrdersMetadata(openOrdersRes.records.map((openOrder: any) => openOrder.metaData))
        setOpenOrders(Object.fromEntries(
          openOrdersRes.records.map(((openOrder: any) => [openOrder.metaData.orderHash, openOrder.order]))
        ));

        const allPositions = positions.longPositions.map((lc: any) => ({
          ...lc,
          contractName: lc.contractName + '-long',
          daysToMaturity: Math.ceil(dayjs(lc.time * 1000).add(CONTRACT_DURATION, 'd').diff(dayjs(), 'd', true))
        })).concat(positions.shortPositions.map((sc: any) => ({
          ...sc,
          contractName: sc.contractName + '-short',
          daysToMaturity: Math.ceil(dayjs(sc.time * 1000).add(CONTRACT_DURATION, 'd').diff(dayjs(), 'd', true))
        })));

        setActivePositions(allPositions.filter((p: any) => !p.contract.settlement));
        const sctw = allPositions.filter((c: any) => c.daysToMaturity <= 0 && c?.pendingReward?.gt(0))
        setSettledPositionsToWithdraw(sctw);
        setCollateralForWithdraw(sctw.reduce((total: BigNumber, contract: any) => total.plus(contract?.pendingReward), new BigNumber(0)));
        setSettledPositions(allPositions.filter((c: any) => c.daysToMaturity <= 0 && c?.pendingReward.eq(0)))
        setRefresh(false);
      }
    }
    getPorfolio();
    return () => { cancelled = true }

  }, [address, honeylemonService, refresh])

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
              <Button fullWidth>NEW OFFER</Button>
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
                </TableBody>
              </Table>
              <Divider className={classes.sectionDivider} light variant='middle' />
              <Typography variant='h5' style={{ fontWeight: 'bold' }} color='secondary'>Positions</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Swap</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Days</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activePositions && activePositions?.map((contract: any, i) =>
                    <TableRow key={i}>
                      <TableCell>{contract.contractName}</TableCell>
                      <TableCell align='center'>{contract.qtyToMint}</TableCell>
                      <TableCell>{contract.daysToMaturity}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </> :
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Swap</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>BTC</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settledPositionsToWithdraw?.map((contract: any, i) =>
                    <TableRow key={i}>
                      <TableCell>{contract.contractName}</TableCell>
                      <TableCell align='center'>{contract.qtyToMint}</TableCell>
                      <TableCell align='right'>{contract.qtyToMint}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Button fullWidth disabled={collateralForWithdraw === 0}>
                WITHDRAW ALL {collateralForWithdraw > 0 ?
                  `(${collateralForWithdraw} BTC)` :
                  <RadioButtonUnchecked className={classes.icon} />}
              </Button>
              <Divider className={classes.sectionDivider} light variant='middle' />
              <Typography variant='h5' style={{ fontWeight: 'bold' }} color='secondary'>Closed</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Swap</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>BTC</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settledPositions.map((contract: any, i) =>
                    <TableRow key={i}>
                      <TableCell>{contract.contractName}</TableCell>
                      <TableCell align='center'>{contract.qtyToMint}</TableCell>
                      <TableCell align='right'>{contract.qtyToMint}</TableCell>
                    </TableRow>
                  )}
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
