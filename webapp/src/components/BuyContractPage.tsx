import React, { useState, useEffect } from 'react';
import { Button, Typography, Grid, makeStyles, FilledInput, Link, InputAdornment } from '@material-ui/core';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import { useOnboard } from '../contexts/OnboardContext';
const { BigNumber } = require('@0x/utils');

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
  const { address } = useOnboard();
  const { honeylemonService } = useHoneylemon()
  const classes = useStyles();

  const [totalPrice, setTotalPrice] = useState(0);
  const [hashPrice, setHashPrice] = useState(0);
  const [totalHashAmount, setTotalHashAmount] = useState(0);
  const [isValid, setIsValid] = useState(false);

  const [resultOrders, setResultOrders] = useState([]);
  const [takerAssetFillAmounts, setTakerFillAmounts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      const result = await honeylemonService.getQuoteForBudget(new BigNumber(totalPrice))
      if (!cancelled) {
        const isLiquid = !!(Number(result?.remainingTakerFillAmount?.toString() || -1) === 0)
        setIsValid(isLiquid);
        setHashPrice(Number(result?.price?.toString()) || 0);
        setTotalHashAmount(Number(result?.totalTakerFillAmount?.toString()) || 0);
        setResultOrders(result.resultOrders);
        setTakerFillAmounts(result.takerAssetFillAmounts);
      }
    };
    fetchData();
    return () => { cancelled = true }
  }, [totalPrice, honeylemonService]);

  const buyOffer = async () => {
    try {
      if (await !honeylemonService.checkPaymentTokenApproval(address)) {
        await honeylemonService.approvePaymentToken(address);
      }

      const gasPrice = 5e9; // 5 GWEI

      const tx = await honeylemonService.getFillOrdersTx(
        resultOrders,
        takerAssetFillAmounts
      );

      const value = await honeylemonService.get0xFeeForOrderBatch(
        gasPrice,
        resultOrders.length
      );

      const gas = await honeylemonService.estimateGas(
        resultOrders,
        takerAssetFillAmounts,
        address,
      );

      const txHash = await tx.sendTransactionAsync({
        from: address,
        gas,
        gasPrice,
        value
      });
    } catch (error) {
      console.log('Something went wrong buying this contract');
      console.log(error);
    }
  }

  return (
    <Grid container alignItems='stretch' justify='center' spacing={2}>
      <Grid item xs={12}>
        <Typography style={{ fontWeight: 'bold' }}>Buy Mining Rewards</Typography>
      </Grid>
      <Grid item xs={6}><Typography style={{ fontWeight: 'bold' }}>PRICE</Typography></Grid>
      <Grid item xs={6} className={classes.rightAlign}><Typography color='secondary'>${hashPrice} Th/day</Typography></Grid>
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
      <Button fullWidth onClick={() => buyOffer()} disabled={!isValid}>BUY NOW</Button><Grid item xs={12}></Grid>
      <Grid item xs={12}>
        <Typography>
          You will pay ${totalPrice} to buy {totalHashAmount} Th of hasrate for 28 days for ${hashPrice} Th/day.
          You will receive the average value of the <Link href='#'>Mining Revenue Index</Link> over 28 days.
          Representing {totalHashAmount} Th of mining power per day per contract.
        </Typography>
      </Grid>
      <Grid item><Typography>See <Link href='#'>full contract specification here.</Link></Typography></Grid>
    </Grid>
  )
}

export default BuyContractPage;
