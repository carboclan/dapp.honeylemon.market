import React, { useState, useEffect } from 'react';
import { Typography, Grid, makeStyles, Tabs, Tab, Button, TableRow, TableHead, TableCell, Table, TableBody, Paper, Divider } from '@material-ui/core';
import { useOnboard } from '../contexts/OnboardContext';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import { BigNumber } from '@0x/utils';
import dayjs from 'dayjs'
import { RadioButtonUnchecked } from '@material-ui/icons';
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
  const { honeylemonService } = useHoneylemon();

  const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active')
  const [collateralForWithdraw, setCollateralForWithdraw] = useState(0);
  const [openOrders, setOpenOrders] = useState<
    Array<{
      orderHash: string,
      remainingFillableMakerAssetAmount: BigNumber,
      price: number
    }>>([]);
  const [activeContracts, setActiveContracts] = useState([]);
  const [settledContractsToWithdraw, setSettledContractsToWithdraw] = useState([]);
  const [settledContracts, setSettledContracts] = useState([]);

  const handleSetActiveTab = (event: React.ChangeEvent<{}>, newValue: 'active' | 'settled') => {
    setActiveTab(newValue);
  };

  const cancelOpenOrder = async (orderHash: string) => {
    console.log(`Cancelling ${orderHash}`);
  }

  useEffect(() => {
    let cancelled = false;

    const getPorfolio = async () => {
      const openOrders = await honeylemonService.getOpenOrders(address);
      const contracts = await honeylemonService.getContracts(address);
      if (!cancelled) {
        setOpenOrders(openOrders.records.map((openOrder: any) => openOrder.metaData))

        const allContracts = contracts.longContracts.map((lc: any) => ({
          ...lc,
          contractName: lc.contractName + '-long',
          daysToMaturity: dayjs(lc.time * 1000).add(28, 'd').diff(dayjs(), 'd')
        })).concat(contracts.shortContracts.map((sc: any) => ({
          ...sc,
          contractName: sc.contractName + '-short',
          daysToMaturity: dayjs(sc.time * 1000).add(28, 'd').diff(dayjs(), 'd')
        })));

        setActiveContracts(allContracts.filter((c: any) => c.daysToMaturity > 0));
        const sctw = allContracts.filter((c: any) => c.daysToMaturity <= 0 && c?.withdrawalAmount > 0)
        setSettledContractsToWithdraw(sctw);
        setCollateralForWithdraw(sctw.reduce((total: any, contract: any) => total += contract?.withdrawalAmount, 0))
        setSettledContracts(allContracts.filter((c: any) => c.daysToMaturity <= 0 && c?.withdrawalAmount === 0))
      }
    }
    getPorfolio();
    return () => { cancelled = true }

  }, [address, honeylemonService])

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
                  {openOrders && openOrders?.map(order =>
                    <TableRow key={order.orderHash}>
                      <TableCell>{order?.remainingFillableMakerAssetAmount.toString()}</TableCell>
                      <TableCell align='center'>${order?.price.toFixed(2)}</TableCell>
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
                  {activeContracts && activeContracts?.map((contract: any, i) =>
                    <TableRow key={i}>
                      <TableCell>{contract.contractName}</TableCell>
                      <TableCell align='center'>{contract.qtyToMint}</TableCell>
                      <TableCell></TableCell>
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
                  {settledContractsToWithdraw?.map((contract: any, i) =>
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
                  {settledContracts.map((contract: any, i) =>
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
