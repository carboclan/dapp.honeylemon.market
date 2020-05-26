import React, { useState } from 'react';
import { Button, Typography, Grid, makeStyles, FilledInput, Link, InputAdornment, Tabs, Tab } from '@material-ui/core';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import { useOnboard } from '../contexts/OnboardContext';
import { forwardTo } from '../helpers/history';
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

const TabPanel = ({ children, value, index, ...other }: TabPanelProps) => (
  <Grid item xs={12}
    role="tabpanel"
    hidden={value !== index}
    {...other}
    style={{
      display: 'flex',
      padding: (value !== index) ? '0px' : '8px',
    }}
  >
    {value === index && (children)}
  </Grid>
);

enum BuyType { 'budget', 'quantity' };

const BuyContractPage: React.SFC = () => {
  const { address } = useOnboard();
  const { honeylemonService, PAYMENT_TOKEN_DECIMALS, paymentTokenAllowance, CONTRACT_DURATION } = useHoneylemon()
  const classes = useStyles();

  const [budget, setBudget] = useState(0);
  const [orderValue, setOrderValue] = useState(0);

  const [hashPrice, setHashPrice] = useState(0);
  const [orderQuantity, setOrderQuantity] = useState(0);
  const [isValid, setIsValid] = useState(false);

  const [resultOrders, setResultOrders] = useState([]);
  const [takerAssetFillAmounts, setTakerFillAmounts] = useState([]);
  const [buyType, setBuyType] = React.useState<BuyType>(BuyType.budget);

  const handleChangeBuyType = (event: React.ChangeEvent<{}>, newValue: BuyType) => {
    setBuyType(newValue);
    setBudget(orderValue);
  };

  const validateOrderQuantity = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValueString = e.target.value;
    if (!newValueString) {
      setOrderQuantity(0);
      return;
    }
    const newValue = parseFloat(newValueString);
    !isNaN(newValue) && setOrderQuantity(newValue);

    try {
      const result = await honeylemonService.getQuoteForSize(new BigNumber(newValue))
      const isLiquid = !!(Number(result?.remainingMakerFillAmount?.toString() || -1) === 0)
      setIsValid(isLiquid);
      setHashPrice(Number(result?.price?.dividedBy(CONTRACT_DURATION).toString()) || 0);
      setOrderValue(Number(result?.totalTakerFillAmount?.shiftedBy(-PAYMENT_TOKEN_DECIMALS).toString()) || 0);
      setResultOrders(result?.resultOrders || undefined);
      setTakerFillAmounts(result?.takerAssetFillAmounts || undefined);
    } catch (error) {
      console.log('Error getting the current liquidity')
      console.log(error);
      setIsValid(false);
    }
  }

  const validateOrderValue = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValueString = e.target.value;
    if (!newValueString) {
      setOrderValue(0);
      return;
    }
    const newValue = parseFloat(newValueString);
    !isNaN(newValue) && setBudget(newValue)
    try {
      const result = await honeylemonService.getQuoteForBudget(newValue);
      const isLiquid = !!(Number(result?.remainingTakerFillAmount?.toString() || -1) === 0);
      setIsValid(isLiquid);
      setHashPrice(Number(result?.price?.dividedBy(CONTRACT_DURATION).toString()) || 0);
      setOrderQuantity(Number(result?.totalMakerFillAmount?.toString()) || 0);
      setResultOrders(result.resultOrders || undefined);
      setTakerFillAmounts(result.takerAssetFillAmounts || undefined);
      setOrderValue(Number(result?.totalTakerFillAmount?.shiftedBy(-PAYMENT_TOKEN_DECIMALS).toString()) || 0);
    } catch (error) {
      console.log('Error getting the current liquidity')
      console.log(error);
      setIsValid(false);
    }
  }

  const buyOffer = async () => {
    try {
      if (paymentTokenAllowance < orderValue) {
        await honeylemonService.approvePaymentToken(address, new BigNumber(orderValue).shiftedBy(PAYMENT_TOKEN_DECIMALS));
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

      await tx.awaitTransactionSuccessAsync({
        from: address,
        gas,
        gasPrice,
        value
      });
      forwardTo('/portfolio')
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
      <Grid item xs={6} className={classes.rightAlign}><Typography color='secondary'>${hashPrice.toPrecision(6)} Th/day</Typography></Grid>
      <Grid item xs={12}>
        <Tabs
          value={buyType}
          onChange={handleChangeBuyType}
          indicatorColor="secondary"
          variant="fullWidth"
          textColor="primary"
          scrollButtons="auto"
        >
          <Tab label="Enter budget" />
          <Tab label="Enter amount" />
        </Tabs>
      </Grid>
      <TabPanel value={buyType} index={0}>
        <Grid item xs={9} className={classes.rightAlign}>
          <FilledInput
            fullWidth
            disableUnderline
            inputProps={{
              className: classes.inputBase,
              min: 0,
              max: 10000000000, //Max Liquidity or takerTokenBalance
              step: 1
            }}
            startAdornment={<InputAdornment position="start">$</InputAdornment>}
            onChange={validateOrderValue}
            value={budget}
            type='number' />
        </Grid>
        <Grid item xs={2} className={classes.rightAlign}>
          <Typography style={{ fontWeight: 'bold' }} color='secondary'>USDT</Typography>
        </Grid>
      </TabPanel>
      <TabPanel value={buyType} index={1}>
        <Grid item xs={9} className={classes.rightAlign}>
          <FilledInput
            fullWidth
            disableUnderline
            inputProps={{
              className: classes.inputBase,
              min: 0,
              max: 10000000000, //Max Liquidity or takerTokenBalance
              step: 1
            }}
            onChange={validateOrderQuantity}
            value={orderQuantity}
            type='number' />
        </Grid>
        <Grid item xs={2} className={classes.rightAlign}>
          <Typography style={{ fontWeight: 'bold' }} color='secondary'>TH</Typography>
        </Grid>
      </TabPanel>
      <Grid item xs={12}><Button fullWidth onClick={() => buyOffer()} disabled={!isValid}>BUY NOW</Button></Grid>
      <Grid item xs={12}>
        <Typography>
          You will pay ${orderValue} to buy {orderQuantity} Th of hasrate for 28 days for ${hashPrice.toPrecision(6)} Th/day.
          You will receive the average value of the <Link href='#'>Mining Revenue Index</Link> over 28 days.
          Representing {orderQuantity} Th of mining power per day per contract.
        </Typography>
      </Grid>
      <Grid item><Typography>See <Link href='#'>full contract specification here.</Link></Typography></Grid>
    </Grid>
  )
}

export default BuyContractPage;
