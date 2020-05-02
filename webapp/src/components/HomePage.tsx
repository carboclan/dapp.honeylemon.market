import React from 'react';
import { Link, Button, Typography, makeStyles, Grid, Divider } from '@material-ui/core';
import { forwardTo } from '../history';

const useStyles = makeStyles(({palette, spacing}) => ({
  button: {
    backgroundColor: palette.secondary.main,
    color: palette.common.black,
  },
  divider: {
    margin: spacing(2),
  }
}))

const HomePage: React.SFC = () => {
  // const { wallet, onboard, address, network, balance, notify } = useOnboard();
  const classes = useStyles();
  return (
    <Grid container direction='column'>
      <Typography color="secondary" variant='h5' align='center'>Sweet Deals On Cyrpto</Typography>
      <Link href="/stats">
        <Typography align='center' style={{fontWeight: 'bold'}} gutterBottom>
          <span role="img" aria-label="fire">🔥</span>
          Mining Market Live Stats
          <span role="img" aria-label="fire">🔥</span>
        </Typography>
      </Link>
      <Typography variant='h5' style={{fontWeight: 'bold'}}>I am a BTC Holder</Typography>
      <Typography color='secondary' style={{fontWeight: 'bold'}} gutterBottom>Pay cash & earn miner rewards</Typography>
      <Button onClick={() => forwardTo('/buy')} className={classes.button}>BUY CONTRACTS</Button>
      <Divider className={classes.divider} />
      <Typography variant='h5' style={{fontWeight: 'bold'}}>I am a BTC miner</Typography>
      <Typography color='secondary' style={{fontWeight: 'bold'}}>Hedge risk & get cash up front</Typography>
      <Button onClick={() => forwardTo('/offer')} className={classes.button}>OFFER CONTRACTS</Button>
    </Grid>
  )
}

export default HomePage;
