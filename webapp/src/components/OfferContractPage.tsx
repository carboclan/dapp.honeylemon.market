import React, { useState, useEffect } from 'react';
import { Button, Typography, Grid, makeStyles, FilledInput, Link, InputAdornment, Paper } from '@material-ui/core';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import { useOnboard } from '../contexts/OnboardContext';
import { BigNumber } from '@0x/utils';
import { forwardTo } from '../helpers/history';

const useStyles = makeStyles(({ spacing, palette }) => ({
  rightAlign: {
    textAlign: 'end',
  },
  inputBase: {
    textAlign: 'end',
    padding: spacing(1)
  },
  notification: {
    backgroundColor: palette.secondary.main,
    color: palette.common.black,
    textAlign: 'center',
    marginLeft: -spacing(2),
    marginRight: -spacing(2),
    marginTop: -spacing(2),
    padding: spacing(2),
    '&:hover': {
      backgroundColor: palette.secondary.dark,
    }
  },
  offerForm: {
    marginTop: 0,
  },
}))

const OfferContractPage: React.SFC = () => {
  const { honeylemonService, 
    COLLATERAL_TOKEN_DECIMALS, 
    collateralTokenAllowance, 
    collateralTokenBalance, 
    CONTRACT_DURATION 
  } = useHoneylemon();
  const { address = '0x' } = useOnboard();
  const classes = useStyles();

  const [hashPrice, setHashPrice] = useState(0);
  const [hashAmount, setHashAmount] = useState(0);
  const [totalHashPrice, setTotalHashPrice] = useState(0);
  const [collateralAmount, setCollateralAmount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const getCollateralForContract = async () => {
      try {
        const result = await honeylemonService.getCollateralForContract(hashAmount)
        if (!cancelled) {
          setCollateralAmount(Number(new BigNumber(result || 0).shiftedBy(-COLLATERAL_TOKEN_DECIMALS).toString()));
        }
      } catch (error) {
        console.log('Something went wrong fetching required collateral amount')
        console.log(error);
      }
    };
    getCollateralForContract();
    return () => { cancelled = true }
  }, [hashAmount, honeylemonService, COLLATERAL_TOKEN_DECIMALS]);

  useEffect(() => {
    setTotalHashPrice(hashPrice * hashAmount * CONTRACT_DURATION)
  }, [hashPrice, hashAmount, CONTRACT_DURATION])

  const createOffer = async () => {
    try {
      const order = honeylemonService.createOrder(address, new BigNumber(hashAmount), new BigNumber(CONTRACT_DURATION).multipliedBy(hashPrice));
      const signedOrder = await honeylemonService.signOrder(order);
      await honeylemonService.submitOrder(signedOrder);
      forwardTo('/portfolio')
    } catch (error) {
      console.log('Something went wrong creating the offer');
      console.log(error);
    }
  }

  const approveCollateralToken = async () => {
    try {
      await honeylemonService.approveCollateralToken(address);
    } catch (error) {
      console.log('Something went wrong approving the tokens');
      console.log(error);
    }
  }

  const ERC20ApprovalComplete = collateralTokenAllowance > 0
  const isValid = ERC20ApprovalComplete && collateralAmount <= collateralTokenBalance;

  return (
    <>
      {!ERC20ApprovalComplete &&
        <Paper className={classes.notification} square onClick={approveCollateralToken}>
          <Typography style={{ fontWeight: 'bold' }}>
            Please approve Honeylemon to spend your imBTC to continue
          </Typography>
        </Paper>
      }
      <Grid container alignItems='flex-start' justify='flex-start' spacing={2} className={classes.offerForm}>
        <Grid item xs={12}>
          <Typography style={{ fontWeight: 'bold' }}>Offer a {CONTRACT_DURATION} day Mining Revenue Contract</Typography>
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
            type='number'
            disabled={!isValid} />
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
            type='number'
            disabled={!ERC20ApprovalComplete} />
        </Grid>
        <Grid item xs={2} className={classes.rightAlign}>
          <Typography style={{ fontWeight: 'bold' }} color='secondary'>Th</Typography>
        </Grid>
        <Grid item xs={6}><Typography style={{ fontWeight: 'bold' }}>Total:</Typography></Grid>
        <Grid item xs={4} style={{ textAlign: 'center' }}><Typography style={{ fontWeight: 'bold' }}>${totalHashPrice.toFixed(2)}</Typography></Grid>
        <Grid item xs={12}><Typography style={{ fontStyle: 'italic', fontSize: 12 }}>${hashPrice} Th/day * {CONTRACT_DURATION} Days * {hashAmount} Contracts</Typography></Grid>
        <Grid item xs={12}><Button fullWidth onClick={createOffer} disabled={!isValid}>CREATE OFFER</Button></Grid>
        <Grid item xs={12}>
          <Typography>
            You will offer {hashAmount} contracts at ${hashPrice} Th/day.
          If a hodler buys your offer you will receive ${totalHashPrice.toFixed(2)} USDT.
          You will be asked to post the hodlers max win of {collateralAmount} BTC as collateral.
          The amount of that collateral that the hodler receives will be determined
          by the average value of the <Link href='#'>Mining Revenue Index</Link> over the&nbsp;
          {CONTRACT_DURATION} days starting when the hodler pays you.
        </Typography>
        </Grid>
        <Grid item xs={12}><Typography>See <Link href='#'>full contract specification here.</Link></Typography></Grid>
      </Grid>
    </>
  )
}

export default OfferContractPage;
