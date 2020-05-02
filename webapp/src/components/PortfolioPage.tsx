import React, { useState } from 'react';
import { Typography, Grid, makeStyles, Tabs, Tab, Button, TableRow, TableHead, TableCell, Table, TableBody } from '@material-ui/core';

const useStyles = makeStyles(({ spacing }) => ({
  rightAlign: {
    textAlign: 'end',
  },
  tabContent: {
    paddingTop: spacing(2)
  },
}))

const PorfolioPage: React.SFC = () => {
  // const { wallet, onboard, address, network, balance, notify } = useOnboard();
  const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active')
  const [btcAmount, setBtcAmount] = useState(0);


  const handleSetActiveTab = (event: React.ChangeEvent<{}>, newValue: 'active' | 'settled') => {
    setActiveTab(newValue);
  };

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
                  <TableRow>
                    <TableCell>13.23</TableCell>
                    <TableCell>$0.115</TableCell>
                    <TableCell><Button>Cancel</Button></TableCell>
                  </TableRow>
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
                  <TableRow>
                    <TableCell>Swap Long-May04</TableCell>
                    <TableCell>13.23</TableCell>
                    <TableCell>14</TableCell>
                  </TableRow>
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
              <Button fullWidth>WITHDRAW ALL ({btcAmount} BTC)</Button>
            </>
          }
        </div>
      </Grid>
    </Grid>
  )
}

export default PorfolioPage;
