import React, { useState, useEffect } from 'react';
import { Button, Typography, Grid, makeStyles, FilledInput, Link, InputAdornment } from '@material-ui/core';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import { useOnboard } from '../contexts/OnboardContext';
import { BigNumber } from '@0x/utils';

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
  const { honeylemonService, COLLATERAL_TOKEN_DECIMALS } = useHoneylemon();
  const { address = '0x' } = useOnboard();
  const classes = useStyles();

  const [hashPrice, setHashPrice] = useState(0);
  const [hashAmount, setHashAmount] = useState(0);
  const [totalHashPrice, setTotalHashPrice] = useState(0);
  const [collateralAmount, setCollateralAmount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      const result = await honeylemonService.getCollateralForContract(hashAmount)
      if (!cancelled) {
        setCollateralAmount(Number(new BigNumber(result || 0).shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString()));
      }
    };
    fetchData();
    return () => { cancelled = true }
  }, [hashAmount, honeylemonService, COLLATERAL_TOKEN_DECIMALS]);

  useEffect(() => {
    setTotalHashPrice(hashPrice * hashAmount * 28)
  }, [hashPrice, hashAmount])

  const createOffer = async () => {
    try {
      const approval = await honeylemonService.checkCollateralTokenApproval(address, collateralAmount)
      if (!approval) {
        await honeylemonService.approveCollateralToken(address, collateralAmount);
      }
      const order = honeylemonService.createOrder(address, new BigNumber(hashAmount), new BigNumber(hashPrice));
      const signedOrder = await honeylemonService.signOrder(order);
      await honeylemonService.submitOrder(signedOrder);
    } catch (error) {
      console.log('Something went wrong creating the offer');
      console.log(error);
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
            step: 0.0001
          }}
          startAdornment={<InputAdornment position="start">$</InputAdornment>}
          onChange={e => {
            const newValueString = e.target.value;
            if (!newValueString) {
              setHashPrice(0);
              setTotalHashPrice(0);
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
      <Grid item xs={4} style={{ textAlign: 'center' }}><Typography style={{ fontWeight: 'bold' }}>${totalHashPrice.toFixed(2)}</Typography></Grid>
      <Grid item xs={12}><Typography style={{ fontStyle: 'italic', fontSize: 12 }}>${hashPrice} Th/day * 28 Days * {hashAmount} Contracts</Typography></Grid>
      <Grid item xs={12}><Button fullWidth onClick={createOffer}>CREATE OFFER</Button></Grid>
      <Grid item xs={12}>
        <Typography>
          You will offer {hashAmount} contracts at ${hashPrice} Th/day.
          If a hodler buys your offer you will receive ${totalHashPrice.toFixed(2)} USDT.
          You will be asked to post the hodlers max win of {collateralAmount} BTC as collateral.
          The amount of that collateral that the hodler receives will be determined
          by the average value of the <Link href='#'>Mining Revenue Index</Link> over the
          28 days starting when the hodler pays you.
        </Typography>
      </Grid>
      <Grid item xs={12}><Typography>See <Link href='#'>full contract specification here.</Link></Typography></Grid>
    </Grid>
  )
}

export default OfferContractPage;
