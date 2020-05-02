import React from 'react';
import { Link, Button, Typography, makeStyles, Grid } from '@material-ui/core';
import { forwardTo } from '../history';

const useStyles = makeStyles(() => {
  button: {

  }
})

const MiningStatsPage: React.SFC = () => {
  // const { wallet, onboard, address, network, balance, notify } = useOnboard();
  const classes = useStyles();
  return (
    <Grid container direction='column'>
      <Typography variant='h3'>Live Stats</Typography>
    </Grid>
  )
}

export default MiningStatsPage;
