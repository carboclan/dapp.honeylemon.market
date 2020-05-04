import React, { useState, useEffect } from 'react';
import { Button, Typography, Grid, makeStyles, FilledInput, Link, InputAdornment } from '@material-ui/core';
import { useHoneyLemon } from '../contexts/HoneyLemonContext';
import { useOnboard } from '../contexts/OnboardContext';

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
  const {honeyLemonService} = useHoneyLemon();
  const { address = '0x' } = useOnboard();
  const classes = useStyles();

  const [hashPrice, setHashPrice] = useState(0);
  const [hashAmount, setHashAmount] = useState(0);
  const [totalHashPrice, setTotalHashPrice] = useState(0);
  const [btcAmount, setBtcAmount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      const result = await honeyLemonService.getCollateralForContract(hashAmount) //TODO Fetch the required amount of collateral from API
      if (!cancelled) {
        setBtcAmount(Number(result)/10^8);
      }
    };
    fetchData();
    setTotalHashPrice(hashPrice * hashAmount * 28)
    return () => { cancelled = true }
  }, [hashPrice, hashAmount, honeyLemonService]);

  const createOffer = async () => {
    try {
      const order = honeyLemonService.createOrder(address, hashAmount, hashPrice);
      const signedOrder = await honeyLemonService.signOrder(order);
      console.log(signedOrder);  
    } catch (error) {
     console.log('Something went wrong creating the offer'); 
    }    
  }

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
          inputProps={{
            className: classes.inputBase,
            min: 0,
            // max: maxProjectContribution,
            step: 0.0001
          }}
          startAdornment={<InputAdornment position="start">$</InputAdornment>}
          onChange={e => {
            const newValueString = e.target.value;
            if (!newValueString) {
              setHashPrice(0);
              return;
            }
            const newValue = parseFloat(newValueString);
            !isNaN(newValue) && setHashPrice(newValue);
          }}
          value={hashPrice}
          type='number' />
      </Grid>
      <Grid item xs={2} className={classes.rightAlign}>
        <Typography style={{ fontWeight: 'bold' }} color='secondary'>Th/day</Typography>
      </Grid>
      <Grid item xs={6}><Typography style={{ fontWeight: 'bold' }}>Quantity</Typography></Grid>
      <Grid item xs={4}>
        <FilledInput
          fullWidth
          disableUnderline
          inputProps={{
            className: classes.inputBase,
            min: 0,
            // max: maxProjectContribution,
            step: 1
          }}
          onChange={e => {
            const newValueString = e.target.value;
            if (!newValueString) {
              setHashAmount(0);
              return;
            }
            const newValue = parseFloat(newValueString);
            !isNaN(newValue) && setHashAmount(newValue);
          }}
          value={hashAmount}
          type='number' />
      </Grid>
      <Grid item xs={2} className={classes.rightAlign}>
        <Typography style={{ fontWeight: 'bold' }} color='secondary'>Th</Typography>
      </Grid>
      <Grid item xs={6}><Typography style={{ fontWeight: 'bold' }}>Total:</Typography></Grid>
      <Grid item xs={4} style={{ textAlign: 'center' }}><Typography style={{ fontWeight: 'bold' }}>${totalHashPrice}</Typography></Grid>
      <Grid item xs={12}><Typography style={{ fontStyle: 'italic', fontSize: 12 }}>${hashPrice} Th/day * 28 Days * {hashAmount} Contracts</Typography></Grid>
      <Grid item xs={12}><Button fullWidth onClick={createOffer}>BUY NOW</Button></Grid>
      <Grid item xs={12}>
        <Typography>
          You will offer ${hashAmount} contracts at ${hashPrice} Th/day. 
          If a hodler buys your offer you will receive ${totalHashPrice} USDT. 
          You will be asked to post the hodlers max win of {btcAmount} BTC as collateral. 
          The amount of that collateral that the hodler receives will be determined 
          by the average value of the <u>Mining Revenue Index</u> over the 28 days starting 
          when the hodler pays you.
        </Typography>
      </Grid>
      <Grid item xs={12}><Typography>See <Link href='#'>full contract specification here.</Link></Typography></Grid>
    </Grid>
  )
}

export default OfferContractPage;
