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
import { Link as RouterLink } from 'react-router-dom';
import MRIInformationModal from './MRIInformationModal';
import OrderbookModal from './OrderbookModal';
import { useEffect } from 'react';

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
  },
  orderSummary: {
    padding: spacing(2),
    width: '100%'
  },
  orderSummaryEstimate: {
    color: palette.primary.main,
    fontWeight: 'bold',
    fontSize: 18
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

  const [budget, setBudget] = useState<number | undefined>(undefined);
  const [orderValue, setOrderValue] = useState<number | undefined>(undefined);

  const [hashPrice, setHashPrice] = useState(0);
  const [orderQuantity, setOrderQuantity] = useState(0);
  const [isLiquid, setIsLiquid] = useState(true);

  const [resultOrders, setResultOrders] = useState([]);
  const [takerAssetFillAmounts, setTakerFillAmounts] = useState<Array<any>>([]);
  const [buyType, setBuyType] = useState<BuyType>(BuyType.budget);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [txActive, setTxActive] = useState(false);
  const [showContractSpecificationModal, setShowContractSpecificationModal] = useState(false);
  const [expectedBTCAccrual, setExpectedBTCAccrual] = useState(0);
  const [discountOnSpotPrice, setDiscountOnSpotPrice] = useState(0);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showBuyFinePrintModal, setShowBuyFinePrintModal] = useState(false);
  const [showMRIInformationModal, setShowMRIInformationModal] = useState(false);
  const [showOrderbook, setShowOrderbook] = useState(false);
  const [skipDsProxy, setSkipDsProxy] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChangeBuyType = (event: React.ChangeEvent<{}>, newValue: BuyType) => {
    setBuyType(newValue);
    setBudget(orderValue);
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
    setErrorMessage('');
    try {
      await deployDSProxyContract();
    } catch (error) {
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
    }
    setTxActive(false);
  }

  const handleBuyOffer = async () => {
    if (!address) {
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
      const value = await honeylemonService.get0xFeeForOrderBatch(
        orderGasPrice,
        resultOrders.length
      );


      const gasEstimate = await honeylemonService.estimateGas(
        resultOrders,
        takerAssetFillAmounts,
        address,
        orderGasPrice,
      );

      const gas = Math.ceil(Number(new BigNumber(gasEstimate).multipliedBy(1.5).toString()));

      await tx.awaitTransactionSuccessAsync({
        from: address,
        gas,
        gasPrice: orderGasPrice,
        value
      });
      setShowBuyModal(false);
      forwardTo('/portfolio')
    } catch (error) {
      console.log('Something went wrong buying this contract');
      console.log(error);
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

  !isDailyContractDeployed && errors.push("New contracts are not available right now");
  !sufficientPaymentTokens && errors.push(`You do not have enough ${PAYMENT_TOKEN_NAME} to proceed`);
  !isLiquid && errors.push("There are not enough contracts available right now");
  orderValue && orderValue < 99 && errors.push('Suggest to increase your contract total to above 100 USDT due to recent high fees in ethereum network. See Fees for details.')

  const getActiveStep = () => {
    if (!skipDsProxy && !isDsProxyDeployed) return 0;
    if (!tokenApprovalGranted) return 1;
    return 2;
  };

  useEffect(() => {
    const step = getActiveStep();
    setActiveStep(step);
  }, [skipDsProxy, isDsProxyDeployed, tokenApprovalGranted])

  const steps = ['Create honeylemon vault', `Approve ${PAYMENT_TOKEN_NAME}`, 'Buy Contracts'];

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return `Create a honeylemon vault. The honeylemon vault will reduce the transaction fees paid when redeeming in future. This step is optional. This is a once-off operation.`;
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
    setSkipDsProxy(false);
    setShowBuyModal(true);
    activeStep === 2 && handleBuyOffer();
  }

  const handleOrderDetailsClick = () => {
    setShowOrderDetails(!showOrderDetails);
  };

  // Set default quantity
  useEffect(() => {
    const startingBudget = Math.min(100, paymentTokenBalance);
    setBudget(startingBudget);
  }, [])

  return (
    <>
      <Grid container alignItems='center' justify='flex-start' spacing={2}>
        <Grid item xs={12}>
          <MRIDisplay />
        </Grid>
        <Grid item xs={8}>
          <Typography style={{ fontWeight: 'bold' }}>Buy {CONTRACT_DURATION}-Day Mining Revenue Contract</Typography>
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
            <Tab label="ENTER BUDGET" />
            <Tab label="or" disabled />
            <Tab label="ENTER AMOUNT" />
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
                onChange={validateOrderValue}
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
            <Grid item xs={12}>
              <Typography
                onClick={() => { setShowBuyFinePrintModal(true) }}
                variant='caption' style={{ cursor: 'pointer' }}>
                Enter quantity you would like to buy as budget in {PAYMENT_TOKEN_NAME} to check the best market price below. <Info fontSize='small' />
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
            <Grid item xs={12}>
              <Typography
                onClick={() => { setShowBuyFinePrintModal(true) }}
                variant='caption' style={{ cursor: 'pointer' }}>
                Enter quantity you would like to buy as hash power in terahash (TH) to check the best market price below.<Info fontSize='small' />
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>
        {errors.length > 0 &&
          <Grid item xs={12}>
            <List className={classes.errorList}>
              {errors.map((error: string, i) =>
                <ListItem key={i} onClick={() => (error.includes('enough USDT')) ? setShowTokenInfoModal(true) : null} >
                  <ListItemText>
                    {error}{(error.includes('enough')) && <Info fontSize='small' />}
                  </ListItemText>
                </ListItem>)}
            </List>
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
                    <Link href='#' underline='always' onClick={() => setShowContractSpecificationModal(true)}>
                      Contract Specs <Info fontSize='small' />
                    </Link>
                  </Typography>
                </Grid>
              </Grid>
              <Table size='small'>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      Price<br />
                      Quantity <br />
                      Duration
                    </TableCell>
                    <TableCell align='right'>
                      <strong>${hashPrice.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}/TH/Day<br /></strong>
                      {`${orderQuantity.toLocaleString()}`} TH<br />
                      {`${CONTRACT_DURATION}`} Days
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Contract Total</TableCell>
                    <TableCell align='right'>{`${(orderValue || 0).toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })} ${PAYMENT_TOKEN_NAME}`}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className={classes.orderSummaryEstimate}>
                      {discountOnSpotPrice < 0 ? 'Premium' : 'Discount'} vs. Buy BTC * <br />
                      Estimated Revenue * <br />
                      Revenue Cap * <br />
                      <br />
                    </TableCell>
                    <TableCell align='right' className={classes.orderSummaryEstimate}>
                      {Math.abs(discountOnSpotPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}% <br />
                      {`${(expectedBTCAccrual).toLocaleString(undefined, { maximumFractionDigits: 8 })} imBTC`} <br />
                      {`${((expectedBTCAccrual || 0) * CONTRACT_COLLATERAL_RATIO).toLocaleString(undefined, { maximumFractionDigits: 8 })} ${COLLATERAL_TOKEN_NAME}`} <br />
                      <Typography variant='caption'>{`${CONTRACT_COLLATERAL_RATIO * 100} % x MRI_BTC x 28`}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={2} className={classes.orderSummaryEstimateFootnote}>
                      * Assuming constant price and difficulty <br />
                      * Revenue Cap is calculated as 125% of current MRI_BTC times 28 days.
                    </TableCell>
                  </TableRow>
                  {!showOrderDetails ?
                    <TableRow>
                      <TableCell colSpan={2} align='center' onClick={handleOrderDetailsClick} style={{ cursor: 'pointer' }}>
                        Expand Details
                      <IconButton
                          className={classes.expand}
                          aria-label="show more">
                          <ExpandMore />
                        </IconButton>
                      </TableCell>
                    </TableRow> :
                    <>
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
                        <TableCell colSpan={2} style={{ color: '#a9a9a9' }}>
                          * Fillable orders in orderbook and minimum order increment of 1 TH may result in discrepancy between your budget and price quote. <br />
                          * Your order will be subject to additional Ethereum network transaction fee,
                            and 0x Protocol fee, both denominated in ETH. Honeylemon does not charge&nbsp;
                          <Link component={RouterLink} to="/stats" underline='always' >fees.<OpenInNew fontSize='small' /></Link>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2} >
                          <Typography variant='subtitle1'>WHAT DOES IT MEAN?</Typography> <br />
                          <Typography variant='body2' style={{ color: '#a9a9a9' }}>
                            You will pay <strong>{(orderValue || 0).toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })} {PAYMENT_TOKEN_NAME}</strong> to
                            buy <strong>{`${orderQuantity.toLocaleString()}`} TH</strong> of {CONTRACT_DURATION}-Day Mining Revenue Contracts at&nbsp;
                            <strong>{PAYMENT_TOKEN_NAME} {hashPrice.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}/TH/Day</strong>.
                          </Typography>
                          <Typography variant='body2' style={{ color: '#a9a9a9' }}>
                            At settlement, you will receive mining revenue (in {COLLATERAL_TOKEN_NAME}) over {CONTRACT_DURATION} days, which
                            is the network average BTC block reward & transaction fees (MRI_BTC) per TH over contract duration, up to a max
                            revenue of <strong>{`${(((expectedBTCAccrual) || 0) * CONTRACT_COLLATERAL_RATIO).toLocaleString(undefined, { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS })} ${COLLATERAL_TOKEN_NAME}`}.</strong>&nbsp;
                            You can withdraw your mining revenue (in {COLLATERAL_TOKEN_NAME}) after settlement.
                          </Typography>
                          <Typography variant='body2' style={{ color: '#a9a9a9' }}>
                            You will receive the network average BTC block reward & transaction fees per TH based on the average value of
                            the <Link href='#' underline='always' onClick={() => setShowMRIInformationModal(true)}>Bitcoin Mining Revenue
                            Index (MRI_BTC) <Info fontSize='small' /></Link> over {CONTRACT_DURATION} days starting today.
                          </Typography>
                          <Typography variant='body2' style={{ color: '#a9a9a9' }}>
                            You may check your PNL from your Portfolio once order is placed. You can withdraw your mining revenue
                            denominated in {COLLATERAL_TOKEN_NAME} after {dayjs().utc().startOf('day').add(1, 'minute')
                              .add(CONTRACT_DURATION + 1, 'd').format('YYYY/MM/DD HH:mm')} UTC.
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2} align='center' onClick={handleOrderDetailsClick} style={{ cursor: 'pointer' }}>
                          Collapse Details
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
      <Dialog
        open={showBuyFinePrintModal}
        onClose={() => setShowBuyFinePrintModal(false)}
        aria-labelledby="form-dialog-title">
        <DialogTitle>Buy Order Details</DialogTitle>
        <DialogContent>
          <Typography>
            • You need to have sufficient amount of {PAYMENT_TOKEN_NAME} to pay for the contract costs upfront and some ETH to pay for the ethereum network transaction fee (gas fee).<br /><br />
            • We suggest your contract total value of above $100 to take into consideration the recent high gas cost. If you consider using Honeylemon more than once, we suggest you choose “Creating Honeylemon Vault”, which deploys DSProxy contract, to reduce gas costs and streamline user experience across multiple orders. <br /><br />
            • You may view your current available {PAYMENT_TOKEN_NAME} and ETH balance on the sidebar menu.<br /><br />
            • You will be prompted for ethereum network transaction fees (gas fees), and 0x protocol transaction fee. Honeylemon Alpha does not charge fees.&nbsp;<Link href='https://docs.honeylemon.market/fees'>Learn more about Fees.<OpenInNew fontSize='small' /></Link>
          </Typography>
        </DialogContent>
      </Dialog>
      <Dialog
        open={showBuyModal}
        onClose={handleCloseBuyDialog}
        aria-labelledby="form-dialog-title"
        disableBackdropClick
        disableEscapeKeyDown>
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
