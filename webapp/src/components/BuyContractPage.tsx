import React, { useState } from 'react';
import { Button, Typography, Grid, makeStyles, FilledInput, Link } from '@material-ui/core';

const useStyles = makeStyles(({spacing}) => ({
  rightAlign: {
    textAlign: 'end',
  },
  inputBase: {
    textAlign: 'end',
    padding: spacing(1)
  }
}))

const BuyContractPage: React.SFC = () => {
  // const { wallet, onboard, address, network, balance, notify } = useOnboard();
  const [totalPrice, setTotalPrice] = useState(0);
  const [hashAmount, setHashAmount] = useState(0);
  const [hashPrice, setTotalHashPrice] = useState(0);
  const [totalHashAmount, setTotalHashAmount] = useState(0);

  const classes = useStyles();
  return (
    <Grid container alignItems='stretch' justify='center' spacing={2}>
      <Grid item xs={12}>
        <Typography style={{ fontWeight: 'bold' }}>Buy Mining Rewards</Typography>
      </Grid>
      <Grid item xs={6}><Typography style={{ fontWeight: 'bold' }}>PRICE</Typography></Grid>
      <Grid item xs={6} className={classes.rightAlign}><Typography color='secondary'>$0.115 Th/day</Typography></Grid>
      <Grid item xs={12}><Typography style={{ fontWeight: 'bold' }}>ENTER BUDGET</Typography></Grid>
      <Grid item xs={10} className={classes.rightAlign}>
        <FilledInput fullWidth disableUnderline inputProps={{className: classes.inputBase}}/>
      </Grid>
      <Grid item xs={2} className={classes.rightAlign}>
        <Typography style={{ fontWeight: 'bold' }} color='secondary'>USDT</Typography>
      </Grid>
      <Grid item xs={12}><Typography className={classes.rightAlign}>31.06 Th for 28 days</Typography></Grid>
      <Button fullWidth>BUY NOW</Button>
      <Typography>
        You will pay ${totalPrice} buy {hashAmount} Th of hasrate for 28 days for ${hashPrice} Th/day.
        You will receive the average value of the <Link href='#'>Mining Revenue Index</Link> over 28 days.
        Representing {totalHashAmount} Th of mining power per day per contract.
      </Typography>
      <Link href='#'>See full contract specification here.</Link>
    </Grid>
  )
}

export default BuyContractPage;
