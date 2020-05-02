import React, { useState } from 'react';
import { Button, Typography, Grid, makeStyles, FilledInput, Link, InputAdornment } from '@material-ui/core';

const useStyles = makeStyles(({ spacing }) => ({
  rightAlign: {
    textAlign: 'end',
  },
  inputBase: {
    textAlign: 'end',
    padding: spacing(1)
  }
}))

const OfferContractPage: React.SFC = () => {
  // const { wallet, onboard, address, network, balance, notify } = useOnboard();
  const [hashPrice, setHashPrice] = useState(0);
  const [hashAmount, setHashAmount] = useState(0);
  const [totalHashPrice, setTotalHashPrice] = useState(0);
  const [btcAmount, setBtcAmount] = useState(0);

  const classes = useStyles();
  return (
    <Grid container alignItems='flex-start' justify='flex-start' spacing={2}>
      <Grid item xs={12}>
        <Typography style={{ fontWeight: 'bold' }}>Offer a 28 day Mining Revenue Contract</Typography>
      </Grid>
      <Grid item xs={6}><Typography style={{ fontWeight: 'bold' }}>Price:</Typography></Grid>
      <Grid item xs={4}>
        <FilledInput
          fullWidth
          disableUnderline
          inputProps={{ className: classes.inputBase }}
          placeholder='100'
          startAdornment={<InputAdornment position="start">$</InputAdornment>}
          onChange={e => setHashPrice(Number.parseFloat(e.target.value))} 
          value={hashPrice} />
      </Grid>
      <Grid item xs={2} className={classes.rightAlign}>
        <Typography style={{ fontWeight: 'bold' }} color='secondary'>Th/day</Typography>
      </Grid>
      <Grid item xs={6}><Typography style={{ fontWeight: 'bold' }}>Quantity</Typography></Grid>
      <Grid item xs={4}>
        <FilledInput
          fullWidth
          disableUnderline
          inputProps={{ className: classes.inputBase }}
          placeholder='100'
          startAdornment={<InputAdornment position="start">$</InputAdornment>}
          onChange={e => setHashAmount(Number.parseFloat(e.target.value))}
          value={hashAmount} />
      </Grid>
      <Grid item xs={2} className={classes.rightAlign}>
        <Typography style={{ fontWeight: 'bold' }} color='secondary'>Th</Typography>
      </Grid>
      <Grid item xs={6}><Typography style={{ fontWeight: 'bold' }}>Total:</Typography></Grid>
      <Grid item xs={4} style={{textAlign: 'center'}}><Typography style={{ fontWeight: 'bold' }}>${totalHashPrice}</Typography></Grid>
      <Grid item xs={12}><Typography style={{fontStyle: 'italic', fontSize: 12}}>${hashPrice} Th/day * 28 Days * {hashAmount} Contracts</Typography></Grid>
      <Grid item xs={12}><Button fullWidth>BUY NOW</Button></Grid>
      <Grid item xs={12}>
        <Typography>
          You will offer {hashAmount} contracts at ${hashPrice} Th/day. 
          If a hodler buys your offer you will receive ${setTotalHashPrice} USDT. 
          You will be asked to post the hodlers max win of {btcAmount} BTC as collateral. 
          The amount of that collateral that the hodler receives will be determined 
          by the average value of the <u>Mining Revenue Index</u> over the 28 days starting 
          when the hodler pays you.
        </Typography>
      </Grid>
      <Grid item><Typography>See <Link href='#'>full contract specification here.</Link></Typography></Grid>
    </Grid>
  )
}

export default OfferContractPage;
