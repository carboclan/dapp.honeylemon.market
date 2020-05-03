import React, { useState, useEffect } from 'react';
import { Button, Typography, Grid, makeStyles, FilledInput, Link, InputAdornment } from '@material-ui/core';
import { useHoneyLemon } from '../contexts/HoneyLemonContext';

const useStyles = makeStyles(({ spacing }) => ({
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
  const honeyLemonService = useHoneyLemon();
  const classes = useStyles();

  const [totalPrice, setTotalPrice] = useState(0);
  const [hashAmount, setHashAmount] = useState(0);
  const [hashPrice, setTotalHashPrice] = useState(0);
  const [totalHashAmount, setTotalHashAmount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      const result = 0 //TODO Fetch the required amount of collateral from API
      if (!cancelled) {
        // setTotalHashAmount(Number(result));
      }
    };
    fetchData();
    return () => { cancelled = true }
  }, [hashPrice, hashAmount]);

  return (
    <Grid container alignItems='stretch' justify='center' spacing={2}>
      <Grid item xs={12}>
        <Typography style={{ fontWeight: 'bold' }}>Buy Mining Rewards</Typography>
      </Grid>
      <Grid item xs={6}><Typography style={{ fontWeight: 'bold' }}>PRICE</Typography></Grid>
      <Grid item xs={6} className={classes.rightAlign}><Typography color='secondary'>$0.115 Th/day</Typography></Grid>
      <Grid item xs={12}><Typography style={{ fontWeight: 'bold' }}>ENTER BUDGET</Typography></Grid>
      <Grid item xs={10} className={classes.rightAlign}>
        <FilledInput
          fullWidth
          disableUnderline
          inputProps={{
            className: classes.inputBase,
            min: 0,
            // max: maxProjectContribution,
            step: 1
          }}
          startAdornment={<InputAdornment position="start">$</InputAdornment>}
          onChange={e => {
            const newValueString = e.target.value;
            if (!newValueString) {
              setTotalPrice(0);
              return;
            }
            const newValue = parseFloat(newValueString);
            !isNaN(newValue) && setTotalPrice(newValue);
          }}
          value={totalPrice}
          type='number' />
      </Grid>
      <Grid item xs={2} className={classes.rightAlign}>
        <Typography style={{ fontWeight: 'bold' }} color='secondary'>USDT</Typography>
      </Grid>
      <Grid item xs={12}><Typography className={classes.rightAlign}>31.06 Th for 28 days</Typography></Grid>
      <Button fullWidth>BUY NOW</Button><Grid item xs={12}></Grid>
      <Grid item xs={12}>
        <Typography>
          You will pay ${totalPrice} to buy {hashAmount} Th of hasrate for 28 days for ${hashPrice} Th/day.
          You will receive the average value of the <Link href='#'>Mining Revenue Index</Link> over 28 days.
          Representing {totalHashAmount} Th of mining power per day per contract.
        </Typography>
      </Grid>
      <Grid item><Typography>See <Link href='#'>full contract specification here.</Link></Typography></Grid>
    </Grid>
  )
}

export default BuyContractPage;
