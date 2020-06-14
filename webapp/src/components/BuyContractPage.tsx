import React, { useState } from 'react';
import {
  Button,
  Typography,
  Grid,
  makeStyles,
  FilledInput,
  Link,
  InputAdornment,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  TableRow,
  Table,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@material-ui/core';
import { BigNumber } from '@0x/utils';
import clsx from 'clsx';
import { TabPanel } from './TabPanel';
import { useHoneylemon, TokenType } from '../contexts/HoneylemonContext';
import { useOnboard } from '../contexts/OnboardContext';
import { forwardTo } from '../helpers/history';
import ContractSpecificationModal from './ContractSpecificationModal'
import MRIInformationModal from './MRIInformationModal'
import dayjs from 'dayjs';
import MRIDisplay from './MRIDisplay';


const useStyles = makeStyles(({ spacing, palette }) => ({
  rightAlign: {
    textAlign: 'end',
  },
  inputBase: {
    textAlign: 'end',
    padding: spacing(1)
  },
  loadingSpinner: {
    width: 20,
    flexBasis: 'end',
    flexGrow: 0,
    color: palette.secondary.main,
  },
  errorList: {
    color: palette.secondary.main,
  },
  orderSummary: {
    padding: spacing(2),
    width: '100%'
  },
  orderSummaryEstimate: {
    color: palette.secondary.main,
  },
  orderSummaryBlur: {
    filter: 'blur(3px)',
  },
  button: {
    marginTop: spacing(1),
    marginRight: spacing(1),
    color: palette.common.black,
  },
  actionsContainer: {
    marginBottom: spacing(2),
  },
  premium: {
    color: palette.error.main,
  },
  discount: {
    color: palette.success.main,
  }
}))

enum BuyType { 'budget', 'quantity' };

const BuyContractPage: React.SFC = () => {
  const { address } = useOnboard();
  const {
    honeylemonService,
    PAYMENT_TOKEN_DECIMALS,
    PAYMENT_TOKEN_NAME,
    paymentTokenAllowance,
    CONTRACT_DURATION,
    isDsProxyDeployed,
    paymentTokenBalance,
    CONTRACT_COLLATERAL_RATIO,
    COLLATERAL_TOKEN_DECIMALS,
    marketData,
    deployDSProxyContract,
    approveToken,
  } = useHoneylemon()
  const classes = useStyles();

  const [budget, setBudget] = useState(0);
  const [orderValue, setOrderValue] = useState(0);

  const [hashPrice, setHashPrice] = useState(0);
  const [orderQuantity, setOrderQuantity] = useState(0);
  const [isLiquid, setIsLiquid] = useState(true);

  const [resultOrders, setResultOrders] = useState([]);
  const [takerAssetFillAmounts, setTakerFillAmounts] = useState([]);
  const [buyType, setBuyType] = useState<BuyType>(BuyType.budget);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [txActive, setTxActive] = useState(false);
  const [showContractSpecificationModal, setShowContractSpecificationModal] = useState(false);
  const [expectedBTCAccrual, setExpectedBTCAccrual] = useState(0);
  const [discountOnSpotPrice, setDiscountOnSpotPrice] = useState(0);

  const handleChangeBuyType = (event: React.ChangeEvent<{}>, newValue: BuyType) => {
    setBuyType(newValue);
    setBudget(orderValue);
  };

  const handleCloseBuyDialog = () => {
    setShowBuyModal(false);
  }

  const validateOrderQuantity = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValueString = e.target.value;
    if (!newValueString) {
      setOrderQuantity(0);
      return;
    }
    const newValue = parseInt(newValueString);
    !isNaN(newValue) && setOrderQuantity(newValue);

    try {
      const result = await honeylemonService.getQuoteForSize(new BigNumber(newValue))
      const newIsLiquid = !!(Number(result?.remainingMakerFillAmount?.toString() || -1) === 0)
      const newOrderValue = Number(result?.totalTakerFillAmount?.shiftedBy(-PAYMENT_TOKEN_DECIMALS).toString()) || 0;
      const newExpectedAccrual = Number(new BigNumber(
        await honeylemonService.calculateRequiredCollateral(new BigNumber(newValue))
      ).shiftedBy(-COLLATERAL_TOKEN_DECIMALS)
        .dividedBy(CONTRACT_COLLATERAL_RATIO).toString());

      const { currentBTCSpotPrice } = marketData;
      const discountValue = (!isLiquid) ?
        0 :
        ((currentBTCSpotPrice - (newOrderValue / newExpectedAccrual)) / currentBTCSpotPrice) * 100

      setIsLiquid(newIsLiquid);
      setHashPrice(Number(result?.price?.dividedBy(CONTRACT_DURATION).toString()) || 0);
      setOrderValue(newOrderValue);
      setResultOrders(result?.resultOrders || undefined);
      setTakerFillAmounts(result?.takerAssetFillAmounts || undefined);
      setExpectedBTCAccrual(newExpectedAccrual);
      !isNaN(discountValue) && setDiscountOnSpotPrice(discountValue);
    } catch (error) {
      console.log('Error getting the current liquidity')
      console.log(error);
      setIsLiquid(false);
    }
  }

  const validateOrderValue = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newBudgetString = e.target.value;
    if (!newBudgetString) {
      setOrderValue(0);
      return;
    }
    const newBudgetValue = parseFloat(newBudgetString);
    !isNaN(newBudgetValue) && setBudget(newBudgetValue)
    try {
      const result = await honeylemonService.getQuoteForBudget(newBudgetValue);
      const newIsLiquid = !!(Number(result?.remainingTakerFillAmount?.toString() || -1) === 0)
      const newOrderValue = Number(result?.totalTakerFillAmount?.shiftedBy(-PAYMENT_TOKEN_DECIMALS).toString()) || 0;
      const collateralRequiredForPosition = await honeylemonService.calculateRequiredCollateral(new BigNumber(result.totalMakerFillAmount))
      const newExpectedAccrual = Number(new BigNumber(collateralRequiredForPosition).shiftedBy(-COLLATERAL_TOKEN_DECIMALS)
        .dividedBy(CONTRACT_COLLATERAL_RATIO).toString());
      const { currentBTCSpotPrice } = marketData;
      const discountValue = (!isLiquid) ?
        0 :
        ((currentBTCSpotPrice - (newOrderValue / newExpectedAccrual)) / currentBTCSpotPrice) * 100

      setIsLiquid(newIsLiquid);
      setHashPrice(Number(result?.price?.dividedBy(CONTRACT_DURATION).toString()) || 0);
      setOrderQuantity(Number(result?.totalMakerFillAmount?.toString()) || 0);
      setOrderValue(newOrderValue);
      setResultOrders(result?.resultOrders || undefined);
      setTakerFillAmounts(result?.takerAssetFillAmounts || undefined);
      setExpectedBTCAccrual(newExpectedAccrual);
      !isNaN(discountValue) && setDiscountOnSpotPrice(discountValue);
    } catch (error) {
      console.log('Error getting the current liquidity')
      console.log(error);
      setIsLiquid(false);
    }
  }

  const handleDeployDSProxy = async () => {
    setTxActive(true);
    await deployDSProxyContract();
    setTxActive(false);
  }

  const handleApprovePaymentToken = async () => {
    setTxActive(true);
    await approveToken(TokenType.PaymentToken)
    setTxActive(false);
  }

  const handleBuyOffer = async () => {
    setTxActive(true);
    try {
      // TODO: I dont think this should be hardcoded in here
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
      setShowBuyModal(false);
      forwardTo('/portfolio')
    } catch (error) {
      console.log('Something went wrong buying this contract');
      console.log(error);
      // TODO: Display error on modal
    }
    setTxActive(false);
  }

  const sufficientPaymentTokens = paymentTokenBalance >= orderValue;
  const tokenApprovalGranted = paymentTokenAllowance >= orderValue;
  const isValid = isLiquid && sufficientPaymentTokens;

  const errors = [];

  !sufficientPaymentTokens && errors.push(`You do not have enough ${PAYMENT_TOKEN_NAME} to proceed`);
  !isLiquid && errors.push("There are not enough contracts available right now");

  const getActiveStep = () => {
    if (!isDsProxyDeployed) return 0;
    if (!tokenApprovalGranted) return 1;
    return 2;
  };

  const activeStep = getActiveStep()

  const steps = ['Deploy Wallet', `Approve ${PAYMENT_TOKEN_NAME}`, 'Buy Contracts'];

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return `Deploy a wallet contract. This is a once-off operation`;
      case 1:
        return `Approve ${PAYMENT_TOKEN_NAME}. This is a once-off operation`;
      case 2:
        return `Finalize Purchase`;
    }
  }

  const getStepButtonLabel = (step: number) => {
    switch (step) {
      case 0:
        return `Deploy`;
      case 1:
        return 'Approve';
      case 2:
        return `Buy`;
    }
  }

  const handleStepperNext = (step: number) => {
    switch (step) {
      case 0:
        return handleDeployDSProxy();
      case 1:
        return handleApprovePaymentToken();
      case 2:
        return handleBuyOffer();
    }
  }

  const handleStartBuy = () => {
    setShowBuyModal(true);
    activeStep === 2 && handleBuyOffer();
  }

  return (
    <>
      <Grid container alignItems='center' justify='flex-start' spacing={2}>
        <Grid item xs={12}>
          <MRIDisplay />
        </Grid>
        <Grid item xs={12}>
          <Typography style={{ fontWeight: 'bold' }}>Buy a {CONTRACT_DURATION}-Day Mining Revenue Contract</Typography>
        </Grid>
        <Grid item xs={12}>
          <Tabs
            value={buyType}
            onChange={handleChangeBuyType}
            indicatorColor="secondary"
            variant="fullWidth"
            textColor="primary"
            scrollButtons="auto" >
            <Tab label="ENTER BUDGET" />
            <Tab label="or" disabled />
            <Tab label="ENTER QUANTITY" />
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
                step: 1
              }}
              startAdornment={<InputAdornment position="start">$</InputAdornment>}
              onChange={validateOrderValue}
              value={budget}
              type='number'
              onBlur={e => {
                e.target.value = e.target.value.replace(/^(-)?0+(0\.|\d)/, '$1$2')
              }}
              disabled={showBuyModal} />
          </Grid>
          <Grid item xs={3} className={classes.rightAlign}>
            <Typography style={{ fontWeight: 'bold' }} color='secondary'>{PAYMENT_TOKEN_NAME}</Typography>
          </Grid>
        </TabPanel>
        <TabPanel value={buyType} index={2}>
          <Grid item xs={9} className={classes.rightAlign}>
            <FilledInput
              fullWidth
              disableUnderline
              inputProps={{
                className: classes.inputBase,
                min: 0,
                step: 1
              }}
              onChange={validateOrderQuantity}
              value={orderQuantity}
              type='number'
              onBlur={e => {
                e.target.value = e.target.value.replace(/^(-)?0+(0\.|\d)/, '$1$2')
              }}
              disabled={showBuyModal} />
          </Grid>
          <Grid item xs={3} className={classes.rightAlign}>
            <Typography style={{ fontWeight: 'bold' }} color='secondary'>TH/{CONTRACT_DURATION} Days</Typography>
          </Grid>
        </TabPanel>
        <Grid item xs={12} container spacing={1}>
          <Grid item xs={12} style={{ paddingLeft: 0, paddingRight: 0 }}>
            <Paper className={clsx(classes.orderSummary, {
              [classes.orderSummaryBlur]: !isValid,
            })}>
              <Typography align='center'><strong>Order Summary</strong></Typography>
              <Table size='small'>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      Unit Price <br />
                      Quantity
                  </TableCell>
                    <TableCell align='right'>
                      $ {hashPrice.toFixed(PAYMENT_TOKEN_DECIMALS)} /TH/day <br />
                      {`${orderQuantity.toLocaleString()} TH`}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total</TableCell>
                    <TableCell align='right'>{`$ ${orderValue.toLocaleString()}`}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Start <br />
                    Expiration<br />
                    Settlement
                  </TableCell>
                    <TableCell align='right'>
                      {dayjs().format('YYYY/MM/DD')} <br />
                      {dayjs().add(CONTRACT_DURATION, 'd').format('YYYY/MM/DD')} <br />
                      {dayjs().add(CONTRACT_DURATION + 1, 'd').format('YYYY/MM/DD')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          </Grid>
          <Grid item xs={12} style={{ paddingLeft: 0, paddingRight: 0 }}>
            <Paper className={clsx(classes.orderSummary, {
              [classes.orderSummaryBlur]: !isValid,
            })}>
              <Table size='small'>
                <TableBody>
                  <TableRow>
                    <TableCell className={classes.orderSummaryEstimate}>
                      Discount on Spot BTC Price *
                    </TableCell>
                    <TableCell align='right' className={clsx(classes.orderSummaryEstimate,
                      { [classes.premium]: discountOnSpotPrice < 0 },
                      { [classes.discount]: discountOnSpotPrice > 0 })}>
                      {discountOnSpotPrice.toLocaleString(undefined, { minimumFractionDigits: 5, maximumFractionDigits: 8 })}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className={classes.orderSummaryEstimate}>
                      Expected Accrual *
                    </TableCell>
                    <TableCell align='right' className={classes.orderSummaryEstimate}>
                      {`${(expectedBTCAccrual).toLocaleString(undefined, { minimumFractionDigits: 5, maximumFractionDigits: 8 })} imBTC`}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={2}>
                      * Assuming constant price and difficulty
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
        {errors.length > 0 &&
          <Grid item xs={12}>
            <List className={classes.errorList}>
              {errors.map((error, i) =>
                <ListItem key={i}>
                  <ListItemText>{error}</ListItemText>
                </ListItem>)}
            </List>
          </Grid>
        }
        <Grid item xs={12}>
          <Button
            fullWidth
            onClick={handleStartBuy}
            disabled={!isValid || showBuyModal || resultOrders.length === 0}>
            BUY NOW &nbsp;
              {showBuyModal && <CircularProgress className={classes.loadingSpinner} size={20} />}
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Typography>
            You will pay <strong>$ {orderValue.toLocaleString()}</strong> to buy <strong>{orderQuantity}Th</strong> of hashrate
            for <strong>{CONTRACT_DURATION} days</strong> for <strong>${hashPrice.toLocaleString()}/Th/day</strong>. You will
            receive the average value of the <Link href="#" underline='always'>Mining Revenue Index</Link>&nbsp;
            over <strong>{CONTRACT_DURATION} days</strong> representing <strong>{orderQuantity} Th</strong> of mining power per
            day per contract.
          </Typography>
        </Grid>
        <Grid item><Typography>See <Link href='#' underline='always' onClick={() => setShowContractSpecificationModal(true)}>full contract specification here.</Link></Typography></Grid>
      </Grid>
      <Dialog open={showBuyModal} onClose={handleCloseBuyDialog} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Buy Offer</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  <Typography>{getStepContent(index)}</Typography>
                  <div className={classes.actionsContainer}>
                    <Button
                      onClick={handleCloseBuyDialog}
                      className={classes.button}
                      disabled={txActive}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleStepperNext(activeStep)}
                      className={classes.button}
                      disabled={txActive}>
                      {getStepButtonLabel(activeStep)}&nbsp;
                        {txActive && <CircularProgress className={classes.loadingSpinner} size={20} />}
                    </Button>
                  </div>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
      </Dialog>
      <ContractSpecificationModal open={showContractSpecificationModal} onClose={() => setShowContractSpecificationModal(false)} />
    </>
  )
}
export default BuyContractPage;
