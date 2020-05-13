import React, { useState, useEffect } from 'react';
import { Typography, Grid, makeStyles, Tabs, Tab, Button, TableRow, TableHead, TableCell, Table, TableBody } from '@material-ui/core';
import { useOnboard } from '../contexts/OnboardContext';
import { useHoneylemon } from '../contexts/HoneylemonContext';

const useStyles = makeStyles(({ spacing }) => ({
  rightAlign: {
    textAlign: 'end',
  },
  tabContent: {
    paddingTop: spacing(2)
  },
}))

const PorfolioPage: React.SFC = () => {
  const { address } = useOnboard();
  const { honeylemonService } = useHoneylemon();

  const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active')
  const [collateralForWithdraw,] = useState(0);
  const [openOrders, setOpenOrders] = useState<Array<{ orderHash: string, remainingFillableTakerAssetAmount: number, price: number }>>([]);
  const [activeContracts, setActiveContracts] = useState([]);


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
        setActiveContracts(contracts.longContracts.concat(contracts.shortContracts));
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
                      <TableCell>{order?.remainingFillableTakerAssetAmount}</TableCell>
                      <TableCell>${order?.price}</TableCell>
                      <TableCell><Button onClick={() => cancelOpenOrder(order.orderHash)}>Cancel</Button></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
                      <TableCell>{contract.qtyToMint}</TableCell>
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
                  <TableRow>
                    <TableCell>Swap Long-May04</TableCell>
                    <TableCell>13.23</TableCell>
                    <TableCell>0.043</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Button fullWidth>WITHDRAW ALL ({collateralForWithdraw} BTC)</Button>
            </>
          }
        </div>
      </Grid>
    </Grid>
  )
}

export default PorfolioPage;
