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
  IconButton,
} from '@material-ui/core';
import { BigNumber } from '@0x/utils';
import clsx from 'clsx';
import { TabPanel } from './TabPanel';
import { useHoneylemon, TokenType } from '../contexts/HoneylemonContext';
import { useOnboard } from '../contexts/OnboardContext';
import { forwardTo } from '../helpers/history';
import ContractSpecificationModal from './ContractSpecificationModal'
import dayjs from 'dayjs';
import MRIDisplay from './MRIDisplay';
import { OpenInNew, ExpandMore, Info } from '@material-ui/icons';
import MRIInformationModal from './MRIInformationModal';
import AboutHoneylemonContractModal from './AboutHoneylemonContractModal';

import OrderbookModal from './OrderbookModal';
import { useEffect } from 'react';
import * as Sentry from '@sentry/react';

const useStyles = makeStyles(({ spacing, palette, transitions }) => ({
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
    color: palette.primary.main,
  },
  errorList: {
    color: palette.primary.main,
    fontSize: 0.75,
  },
  orderSummary: {
    padding: spacing(2),
    width: '100%'
  },
  orderSummaryEstimate: {
    color: palette.primary.main,
  },
  orderSummaryEstimateFootnote: {
    color: palette.primary.main,
  },
  orderSummaryBlur: {
    filter: 'blur(3px)',
  },
  button: {
    marginTop: spacing(1),
    marginRight: spacing(1),
  },
  actionsContainer: {
    marginBottom: spacing(2),
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: transitions.create('transform', {
      duration: transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
  viewOfferButton: {
    borderColor: palette.primary.main,
    borderWidth: 2,
    borderStyle: 'solid',
    color: palette.primary.main,
    backgroundColor: '#303030',
    '&:hover': {
      backgroundColor: '#505050',
    },
  },
  subtotal: {
    borderTop: '1.5px solid',
  }
}))

enum BuyType { 'budget', 'quantity' };

const BuyContractPage: React.SFC = () => {
  const { address, gasPrice, refreshGasPrice } = useOnboard();
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
    COLLATERAL_TOKEN_NAME,
    marketData,
    isDailyContractDeployed,
    deployDSProxyContract,
    approveToken,
    setShowTokenInfoModal,
  } = useHoneylemon()
  const classes = useStyles();

  const [budget, setBudget] = useState<number>(0);
  const [orderQuantity, setOrderQuantity] = useState(0);

  const [hashPrice, setHashPrice] = useState(0);
  const [isLiquid, setIsLiquid] = useState(true);
  const [orderValue, setOrderValue] = useState<number | undefined>(undefined);

  const [resultOrders, setResultOrders] = useState([]);
  const [takerAssetFillAmounts, setTakerFillAmounts] = useState<Array<any>>([]);
  const [buyType, setBuyType] = useState<BuyType>(BuyType.budget);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [txActive, setTxActive] = useState(false);
  const [showContractSpecificationModal, setShowContractSpecificationModal] = useState(false);
  const [expectedBTCAccrual, setExpectedBTCAccrual] = useState(0);
  const [discountOnSpotPrice, setDiscountOnSpotPrice] = useState(0);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showAboutHoneylemonContractModal, setShowAboutHoneylemonContractModal] = useState(false);
  const [showMRIInformationModal, setShowMRIInformationModal] = useState(false);
  const [showOrderbook, setShowOrderbook] = useState(false);
  const [skipDsProxy, setSkipDsProxy] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const getQuoteForBudget = async () => {
      if (!honeylemonService) {
        console.log('Please connect a wallet to deploy a DSProxy Contract')
        return;
      }
      try {
        const result = await honeylemonService.getQuoteForBudget(budget);
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
        Sentry.captureException(error);
        setIsLiquid(false);
      }
    }

    const getQuoteForSize = async () => {
      if (!honeylemonService) {
        console.log('Please connect a wallet to deploy a DSProxy Contract')
        return;
      }
      try {
        const result = await honeylemonService.getQuoteForSize(new BigNumber(orderQuantity))
        const newIsLiquid = !!(Number(result?.remainingMakerFillAmount?.toString() || -1) === 0)
        const newOrderValue = Number(result?.totalTakerFillAmount?.shiftedBy(-PAYMENT_TOKEN_DECIMALS).toString()) || 0;
        const newExpectedAccrual = Number(new BigNumber(
          await honeylemonService.calculateRequiredCollateral(new BigNumber(orderQuantity))
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
        Sentry.captureException(error);
        setIsLiquid(false);
      }
    }

    if (buyType === BuyType.budget) {
      getQuoteForBudget();
    } else {
      getQuoteForSize();
    }
  }, [budget, orderQuantity])

  // Set default quantity
  useEffect(() => {
    const startingBudget = Math.min(100, paymentTokenBalance);
    setBudget(startingBudget);
  }, [])

  const handleChangeBuyType = (event: React.ChangeEvent<{}>, newValue: BuyType) => {
    setBuyType(newValue);
    setBudget(orderValue || 0);
  };

  const handleCloseBuyDialog = () => {
    setErrorMessage('');
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
  }

  const validateBudget = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newBudgetString = e.target.value;
    if (!newBudgetString) {
      setBudget(0);
      return;
    }
    const newBudgetValue = parseFloat(newBudgetString);
    !isNaN(newBudgetValue) && setBudget(newBudgetValue)
  }

  const handleDeployDSProxy = async () => {
    setTxActive(true);
    setErrorMessage('');
    try {
      await deployDSProxyContract();
    } catch (error) {
      Sentry.captureException(error);
      setErrorMessage(error);
    }
    setTxActive(false);
  }

  const handleApprovePaymentToken = async () => {
    setTxActive(true);
    setErrorMessage('');
    try {
      await approveToken(TokenType.PaymentToken)
    } catch (error) {
      setErrorMessage(error.toString())
      Sentry.captureException(error);
    }
    setTxActive(false);
  }

  const handleBuyOffer = async () => {
    if (!address || !honeylemonService) {
      console.log("Wallet is not connected. Unable to start buy");
      return;
    }
    setTxActive(true);
    setErrorMessage('')

    try {
      await refreshGasPrice();
      const tx = await honeylemonService.getFillOrdersTx(
        resultOrders,
        takerAssetFillAmounts
      );

      const orderGasPrice = Number(`${gasPrice}e9`);
      console.log(`Order Gas Price: ${orderGasPrice}`);

      const value = await honeylemonService.get0xFeeForOrderBatch(
        orderGasPrice,
        resultOrders.length
      );
      console.log(`0x Order Fee: ${value.toString()}`);
      const gasEstimate = await honeylemonService.estimateGas(
        resultOrders,
        takerAssetFillAmounts,
        address,
        orderGasPrice,
      );
      console.log(`Order Gas Estimate: ${gasEstimate.toString()}`);
      
      const gasLimit = new BigNumber(gasEstimate).multipliedBy(1.5).decimalPlaces(0).toString();
      console.log(`Order Gas Limit: ${gasLimit.toString()}`);
      // Hack to ensure imToken doesnt break
      // @ts-ignore
      // (!!window.imToken) ?
      // await tx.awaitTransactionSuccessAsync({
      //   from: address,
      //   value
      // }) : 
      setShowBuyModal(false);
      forwardTo('/portfolio')
    } catch (error) {
      console.log('Something went wrong buying this contract');
      Sentry.captureException(error);
      setErrorMessage('There was an error creating the offer. Please try again later.')
    }
    setTxActive(false);
  }

  const handleSkipDsProxy = () => {
    setSkipDsProxy(true)
  }

  let sufficientPaymentTokens = true
  let tokenApprovalGranted = true
  let isValid = true

  if (orderValue) {
    sufficientPaymentTokens = paymentTokenBalance >= orderValue;
    tokenApprovalGranted = paymentTokenAllowance >= orderValue;
    isValid = isDailyContractDeployed && isLiquid && sufficientPaymentTokens;
  }
  const errors = [];

  !isDailyContractDeployed && errors.push('New contracts are not available right now');
  !sufficientPaymentTokens && errors.push(`You do not have enough ${PAYMENT_TOKEN_NAME} to proceed. Open Side Menu (top-right) to manage your wallet balance and get more.`);
  !isLiquid && errors.push('There are not enough contracts available right now.');

  const getActiveStep = () => {
    if (!skipDsProxy && !isDsProxyDeployed) return 0;
    if (!tokenApprovalGranted) return 1;
    return 2;
  };

  useEffect(() => {
    const step = getActiveStep();
    setActiveStep(step);
  }, [skipDsProxy, isDsProxyDeployed, tokenApprovalGranted])

  const steps = ['Honeylemon Vault (Optional)', `Approve ${PAYMENT_TOKEN_NAME} for Payment`, 'Complete Payment'];

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return `If you place multiple orders or use it more than once, create Honeylemon Vault will deploy a DSProxy contract for your wallet, which reduces future gas fee and streamline your transactions. Additional Ethereum gas fee applies.`;
      case 1:
        return `You are granting permission for Honeylemon smart contracts to access ${PAYMENT_TOKEN_NAME} in your wallet, enabling order payment with your ${PAYMENT_TOKEN_NAME}. You can turn OFF permission in Side Menu (top-right) - Manage Your Wallet. Additional Ethereum gas fee applies.`;
      case 2:
        return `You are paying ${PAYMENT_TOKEN_NAME} ${orderValue?.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })} for  ${orderQuantity} TH of ${CONTRACT_DURATION}-Day BTC Mining Revenue Contract at a market price of ${hashPrice.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}/TH/Day. Additional Ethereum gas fee and 0x transaction fee apply.`;
    }
  }

  const getStepButtonLabel = (step: number) => {
    switch (step) {
      case 0:
        return `Create`;
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
    setSkipDsProxy(false);
    setShowBuyModal(true);
    // activeStep === 2 && handleBuyOffer();
  }

  const handleOrderDetailsClick = () => {
    setShowOrderDetails(!showOrderDetails);
  };

  return (
    <>
      <Grid container alignItems='center' justify='flex-start' spacing={2}>
        <Grid item xs={12}>
          <MRIDisplay />
        </Grid>
        <Grid item xs={8}>
          <Typography style={{ fontWeight: 'bold' }}>Buy {CONTRACT_DURATION}-Day Mining Revenue Contract <Info fontSize='small' onClick={() => { setShowAboutHoneylemonContractModal(true) }} /></Typography>
        </Grid>
        <Grid item xs={4} style={{ textAlign: 'end' }}>
          <Button
            onClick={() => setShowOrderbook(true)}
            className={classes.viewOfferButton}
            variant='contained'>
            View Offers
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Tabs
            value={buyType}
            onChange={handleChangeBuyType}
            indicatorColor="secondary"
            variant="fullWidth"
            scrollButtons="auto" >
            <Tab label="BUDGET" />
            <Tab label="or" disabled />
            <Tab label="AMOUNT" />
          </Tabs>
        </Grid>
        <TabPanel value={buyType} index={0}>
          <Grid container direction='row'>
            <Grid item xs={9} className={classes.rightAlign}>
              <FilledInput
                fullWidth
                disableUnderline
                inputProps={{
                  className: classes.inputBase,
                  min: 0,
                  step: 1
                }}
                placeholder='0'
                startAdornment={<InputAdornment position="start">$</InputAdornment>}
                onChange={validateBudget}
                value={budget || ''}
                type='number'
                onBlur={e => {
                  e.target.value = e.target.value.replace(/^(-)?0+(0\.|\d)/, '$1$2')
                }}
                disabled={showBuyModal} />
            </Grid>
            <Grid item xs={3} className={classes.rightAlign}>
              <Typography style={{ fontWeight: 'bold' }} color='primary'>{PAYMENT_TOKEN_NAME}</Typography>
            </Grid>
            <Grid item xs={12} style={{ paddingTop: 4 }}>
              <Typography variant='caption'>
                Enter quantity you would like to buy as budget to check the market price below. Make sure
                sufficient {PAYMENT_TOKEN_NAME} &amp; ETH (for fees) is in your wallet.
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>
        <TabPanel value={buyType} index={2}>
          <Grid container direction='row'>
            <Grid item xs={9} className={classes.rightAlign}>
              <FilledInput
                fullWidth
                disableUnderline
                inputProps={{
                  className: classes.inputBase,
                  min: 0,
                  step: 1
                }}
                placeholder='0'
                onChange={validateOrderQuantity}
                value={orderQuantity || ''}
                type='number'
                onBlur={e => {
                  e.target.value = e.target.value.replace(/^(-)?0+(0\.|\d)/, '$1$2')
                }}
                disabled={showBuyModal} />
            </Grid>
            <Grid item xs={3} className={classes.rightAlign}>
              <Typography style={{ fontWeight: 'bold' }} color='primary'>TH for {CONTRACT_DURATION} Days</Typography>
            </Grid>
            <Grid item xs={12} style={{ paddingTop: 4 }}>
              <Typography variant='caption'>
                Enter quantity you would like to buy as hash power to check the market price below. Make sure
                sufficient {PAYMENT_TOKEN_NAME} & ETH (for fees) is in your wallet.
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>
        {errors.length > 0 &&
          <Grid item xs={12}>
            {errors.map((error: string, i) =>
              <Typography
                key={i}
                variant='caption'
                paragraph
                color='secondary'
                onClick={() => (error.includes(`enough ${PAYMENT_TOKEN_NAME}`)) ? setShowTokenInfoModal(true) : null} >
                {error}
              </Typography>
            )}
          </Grid>
        }
        <Grid item xs={12} container>
          <Grid item xs={12} style={{ paddingLeft: 0, paddingRight: 0 }}>
            <Paper className={clsx(classes.orderSummary, {
              [classes.orderSummaryBlur]: !isValid,
            })}>
              <Grid item container xs={12}>
                <Grid item xs={6}>
                  <Typography align='left'><strong>Price Quote</strong></Typography>
                </Grid>
                <Grid item xs={6} style={{ textAlign: 'right' }}>
                  <Typography variant='caption'>
                    <Link href='#' onClick={() => setShowContractSpecificationModal(true)} color='textPrimary'>
                      Contract Specs <Info fontSize='small' />
                    </Link>
                  </Typography>
                </Grid>
              </Grid>
              <Table size='small'>
                <TableBody>
                  <TableRow>
                    <TableCell className={classes.orderSummaryEstimate}>
                      Market Price
                    </TableCell>
                    <TableCell align='right' className={classes.orderSummaryEstimate}>
                      ${hashPrice.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}/TH/Day
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Your Quantity
                    </TableCell>
                    <TableCell align='right'>
                      {`${orderQuantity.toLocaleString()}`} TH
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      Contract Duration
                    </TableCell>
                    <TableCell align='right'>
                      {`${CONTRACT_DURATION}`} Days
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className={classes.subtotal}>Contract Total</TableCell>
                    <TableCell align='right' className={classes.subtotal}>{`${(orderValue || 0).toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })} ${PAYMENT_TOKEN_NAME}`}</TableCell>
                  </TableRow>
                  {orderValue && orderValue < 98 ?
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant='caption' color='secondary'>
                          Suggest to increase your contract total to above 100 {PAYMENT_TOKEN_NAME} due to recent high fees in ethereum network.
                            See <Link href='https://docs.honeylemon.market/fees' target="_blank" rel='noopener' color='secondary'>fees for details.<OpenInNew fontSize='small' /></Link>
                        </Typography>
                      </TableCell>
                    </TableRow> :
                    null
                  }
                  <TableRow>
                    <TableCell className={classes.orderSummaryEstimate}>
                      Estimated Revenue
                    </TableCell>
                    <TableCell align='right' className={classes.orderSummaryEstimate}>
                      {`${(expectedBTCAccrual).toLocaleString(undefined, { maximumFractionDigits: 8 })} ${COLLATERAL_TOKEN_NAME}`}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className={classes.orderSummaryEstimate}>
                      Revenue Cap
                    </TableCell>
                    <TableCell align='right' className={classes.orderSummaryEstimate}>
                      {`${((expectedBTCAccrual || 0) * CONTRACT_COLLATERAL_RATIO).toLocaleString(undefined, { maximumFractionDigits: 8 })} ${COLLATERAL_TOKEN_NAME}`} <br />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className={classes.orderSummaryEstimate}>
                      Buy Contract vs. Buy BTC
                    </TableCell>
                    <TableCell align='right' className={classes.orderSummaryEstimate}>
                      {`${Math.abs(discountOnSpotPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}% ${(discountOnSpotPrice < 0) ? 'Premium' : 'Discount'}`}
                    </TableCell>
                  </TableRow>
                  {!showOrderDetails ?
                    <TableRow>
                      <TableCell colSpan={2} align='center' onClick={handleOrderDetailsClick} style={{ cursor: 'pointer' }}>
                        Find Out More
                      <IconButton
                          className={classes.expand}
                          aria-label="show more">
                          <ExpandMore />
                        </IconButton>
                      </TableCell>
                    </TableRow> :
                    <>
                      <TableRow>
                        <TableCell colSpan={2} style={{ color: '#a9a9a9' }}>
                          <Typography variant='caption'>
                            * <b>Estimated Revenue</b> is the amount of {COLLATERAL_TOKEN_NAME} expected to receive when this contract settles, if BTC price &amp; difficulty stays constant over 28 days. <br />
                            * <b>Revenue Cap</b> is the maximum amount of {COLLATERAL_TOKEN_NAME} you can receive when this contract settles, calculated as 125% of current MRI_BTC times 28. <br />
                            * <b>Buy Contract vs. Buy BTC</b> is the discount/premium of cost basis for this Mining Revenue Contract compared to buying BTC spot with {PAYMENT_TOKEN_NAME} now, if BTC price &amp; difficulty stays constant over 28 days.<br />
                            * Small discrepancy between your Budget and Contract Total is due to available offers in orderbook, and minimum order increment of 1TH.
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          Start <br />
                          Expiration<br />
                          Settlement
                      </TableCell>
                        <TableCell align='right'>
                          {dayjs().utc().startOf('day').add(1, 'minute').format('DD-MMM-YY')}<br />
                          {dayjs().utc().startOf('day').add(1, 'minute').add(CONTRACT_DURATION, 'd').format('DD-MMM-YY')}<br />
                          {dayjs().utc().startOf('day').add(1, 'minute').add(CONTRACT_DURATION + 1, 'd').format('DD-MMM-YY')}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2} >
                          <Typography variant='subtitle1' style={{ paddingTop: 4 }}>WHAT DOES IT MEAN?</Typography> <br />
                          <Typography variant='body2' style={{ color: '#a9a9a9' }} paragraph>
                            You will pay <strong>{(orderValue || 0).toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })} {PAYMENT_TOKEN_NAME}</strong> to
                            buy <strong>{`${orderQuantity.toLocaleString()}`} TH</strong> of {CONTRACT_DURATION}-Day Mining Revenue Contracts at&nbsp;
                            <strong>{PAYMENT_TOKEN_NAME} {hashPrice.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}/TH/Day</strong>.
                          </Typography>
                          <Typography variant='body2' style={{ color: '#a9a9a9' }} paragraph>
                            At settlement, you will receive mining revenue (in {COLLATERAL_TOKEN_NAME}) over {CONTRACT_DURATION} days, which
                            is the network average BTC block reward & transaction fees (MRI_BTC) per TH over contract duration, up to a max
                            revenue of <strong>{`${(((expectedBTCAccrual) || 0) * CONTRACT_COLLATERAL_RATIO).toLocaleString(undefined, { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS })} ${COLLATERAL_TOKEN_NAME}`}.</strong>&nbsp;
                            You can withdraw your mining revenue (in {COLLATERAL_TOKEN_NAME}) after settlement.
                          </Typography>
                          <Typography variant='body2' style={{ color: '#a9a9a9' }} paragraph>
                            You will receive the network average BTC block reward & transaction fees per TH based on the average value of
                            the <Link href='#' onClick={() => setShowMRIInformationModal(true)}>Bitcoin Mining Revenue
                            Index (MRI_BTC) <Info fontSize='small' /></Link> over {CONTRACT_DURATION} days starting today.
                          </Typography>
                          <Typography variant='body2' style={{ color: '#a9a9a9' }} paragraph>
                            You may check your PNL from your Portfolio once order is placed. You can withdraw your mining revenue
                            denominated in {COLLATERAL_TOKEN_NAME} after {dayjs().utc().startOf('day').add(1, 'minute')
                              .add(CONTRACT_DURATION + 1, 'd').format('YYYY/MM/DD HH:mm')} UTC.
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2} align='center' onClick={handleOrderDetailsClick} style={{ cursor: 'pointer' }}>
                          Show Less
                          <IconButton className={clsx(classes.expand, classes.expandOpen)}>
                            <ExpandMore />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    </>
                  }
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Button
            color='primary'
            variant='contained'
            fullWidth
            onClick={handleStartBuy}
            disabled={!isValid || showBuyModal || orderValue === 0 || resultOrders.length === 0}>
            BUY NOW &nbsp;
              {showBuyModal && <CircularProgress className={classes.loadingSpinner} size={20} />}
          </Button>
        </Grid>
      </Grid>
      <AboutHoneylemonContractModal open={showAboutHoneylemonContractModal} onClose={() => setShowAboutHoneylemonContractModal(false)} />
      <Dialog
        open={showBuyModal}
        onClose={handleCloseBuyDialog}
        aria-labelledby="form-dialog-title"
        disableBackdropClick
        disableEscapeKeyDown
        maxWidth='sm'
        fullWidth>
        <DialogTitle id="form-dialog-title">Buy Offer</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  <Typography paragraph>{getStepContent(index)}</Typography>
                  {errorMessage && <Typography color='error'>{errorMessage}</Typography>}
                  <div className={classes.actionsContainer}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleStepperNext(activeStep)}
                      className={classes.button}
                      disabled={txActive}>
                      {getStepButtonLabel(activeStep)}&nbsp;
                        {txActive && <CircularProgress className={classes.loadingSpinner} size={20} />}
                    </Button>
                    {activeStep === 0 ?
                      <Button
                        variant="contained"
                        color='secondary'
                        onClick={handleSkipDsProxy}
                        className={classes.button}
                        disabled={txActive}>
                        Skip
                      </Button> :
                      <Button
                        onClick={handleCloseBuyDialog}
                        className={classes.button}
                        disabled={txActive}>
                        Cancel
                      </Button>
                    }
                  </div>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
      </Dialog>
      <ContractSpecificationModal open={showContractSpecificationModal} onClose={() => setShowContractSpecificationModal(false)} />
      <MRIInformationModal open={showMRIInformationModal} onClose={() => setShowMRIInformationModal(false)} />
      <OrderbookModal open={showOrderbook} onClose={() => setShowOrderbook(false)} />
    </>
  )
}
export default BuyContractPage;
