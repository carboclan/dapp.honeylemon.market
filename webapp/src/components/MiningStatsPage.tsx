import React from 'react';
import { Typography, makeStyles, Grid, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';
import { ReactComponent as HoneyLemonLogo } from '../images/honeylemon-logo.svg';

const useStyles = makeStyles(({ palette }) => ({
  pageHeader: {
    fontWeight: 'bold',
    color: palette.secondary.main,
  },
  winner: {
    width: 20,
    height: 20,
  }
}))

const MiningStatsPage: React.SFC = () => {
  // const { wallet, onboard, address, network, balance, notify } = useOnboard();
  const classes = useStyles();
  return (
    <Grid container direction='column' spacing={2}>
      <Grid item xs={12}>
        <Typography variant='h5' className={classes.pageHeader} align='center'>Live Stats</Typography>
      </Grid>
      <Grid item xs={12} container>
        <Grid item xs={8}>
          <Typography style={{ fontWeight: 'bold' }} color='secondary'>Miner Revenue Index:</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography align='right' style={{ fontWeight: 'bold' }}>$0.13 Th/d</Typography>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <img src={process.env.PUBLIC_URL + '/mri-graph.png'} style={{ width: '100%', height: '200px' }} alt='graph'/>
      </Grid>
      <Grid item xs={12}>
        <Typography>
          The Miner Renevue Index is a fair way to track the payoff of 1 Th/d of hashpower.
          Honeylemon contracts are the only contracts that settle to the Miner Revenue Index
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography style={{ fontWeight: 'bold' }} color='secondary'>
          Cloud Mining Contracts:
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Fee</TableCell>
              <TableCell>Best</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>honeylemon</TableCell>
              <TableCell>$ 0.115 Th/d</TableCell>
              <TableCell>Free</TableCell>
              <TableCell>
                <HoneyLemonLogo className={classes.winner}/>
                <HoneyLemonLogo className={classes.winner}/>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Spot</TableCell>
              <TableCell>$ 0.121 Th/d</TableCell>
              <TableCell>15%</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>3 month</TableCell>
              <TableCell>$ 0.119 Th/d</TableCell>
              <TableCell>6%</TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>6 month</TableCell>
              <TableCell>$ 0.118 Th/d</TableCell>
              <TableCell>8%</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Grid>
    </Grid>
  )
}

export default MiningStatsPage;
