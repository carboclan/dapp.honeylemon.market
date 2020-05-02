import React from 'react';
import { Typography, makeStyles, Grid } from '@material-ui/core';

const useStyles = makeStyles(({ palette }) => ({
  pageHeader: {
    fontWeight: 'bold',
    color: palette.secondary.main,
  }
}))

const MiningStatsPage: React.SFC = () => {
  // const { wallet, onboard, address, network, balance, notify } = useOnboard();
  const classes = useStyles();
  return (
    <Grid container direction='column'>
      <Typography variant='h5' className={classes.pageHeader}>Live Stats</Typography>
    </Grid>
  )
}

export default MiningStatsPage;
