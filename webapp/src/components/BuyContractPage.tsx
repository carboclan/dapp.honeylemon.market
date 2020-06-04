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
import { Link as RouterLink } from 'react-router-dom';
import clsx from 'clsx';
import { TabPanel } from './TabPanel';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import { useOnboard } from '../contexts/OnboardContext';
import { forwardTo } from '../helpers/history';
import ContractSpecificationModal from './ContractSpecificationModal'
import MRIInformationModal from './MRIInformationModal'


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
  orderSummaryBlur: {
    filter: 'blur(2px)',
  },
  button: {
    marginTop: spacing(1),
    marginRight: spacing(1),
    color: palette.common.black,
  },
  actionsContainer: {
    marginBottom: spacing(2),
  },
}))

enum BuyType { 'budget', 'quantity' };

const BuyContractPage: React.SFC = () => {
  const { address } = useOnboard();
  const {
    honeylemonService,
    PAYMENT_TOKEN_DECIMALS,
    paymentTokenAllowance,
    CONTRACT_DURATION,
    isDsProxyDeployed,
    paymentTokenBalance,
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
  const [isTxActive, setTxActive] = useState(false);
  const [showContractSpecificationModal, setShowContractSpecificationModal] = useState(false);
  const [showMRIInformationModal, setShowMRIInformationModal] = useState(false);


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
      setIsLiquid(newIsLiquid);
      setHashPrice(Number(result?.price?.dividedBy(CONTRACT_DURATION).toString()) || 0);
      setOrderValue(Number(result?.totalTakerFillAmount?.shiftedBy(-PAYMENT_TOKEN_DECIMALS).toString()) || 0);
      setResultOrders(result?.resultOrders || undefined);
      setTakerFillAmounts(result?.takerAssetFillAmounts || undefined);
    } catch (error) {
      console.log('Error getting the current liquidity')
      console.log(error);
      setIsLiquid(false);
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
      const newIsLiquid = !!(Number(result?.remainingTakerFillAmount?.toString() || -1) === 0)
      setIsLiquid(newIsLiquid);
      setHashPrice(Number(result?.price?.dividedBy(CONTRACT_DURATION).toString()) || 0);
      setOrderQuantity(Number(result?.totalMakerFillAmount?.toString()) || 0);
      setResultOrders(result.resultOrders || undefined);
      setTakerFillAmounts(result.takerAssetFillAmounts || undefined);
      setOrderValue(Number(result?.totalTakerFillAmount?.shiftedBy(-PAYMENT_TOKEN_DECIMALS).toString()) || 0);
    } catch (error) {
      console.log('Error getting the current liquidity')
      console.log(error);
      setIsLiquid(false);
    }
  }

  const handleDeployDSProxy = async () => {
    setTxActive(true);
    try {
      await honeylemonService.deployDSProxyContract(address);
    } catch (error) {
      console.log('Something went wrong deploying the DS Proxy wallet');
      console.log(error);
      // TODO: Display error on modal
    }
    setTxActive(false);
  }

  const handleApprovePaymentToken = async () => {
    setTxActive(true);
    try {
      await honeylemonService.approvePaymentToken(address);
    } catch (error) {
      console.log('Something went wrong approving the tokens');
      console.log(error);
      // TODO: Display error on modal
    }
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

  !sufficientPaymentTokens && errors.push("You do not have enough USDC to proceed");
  !isLiquid && errors.push("There are not enough contracts available right now");

  const getActiveStep = () => {
    if (!isDsProxyDeployed) return 0;
    if (!tokenApprovalGranted) return 1;
    return 2;
  };

  const activeStep = getActiveStep()

  const steps = ['Deploy Wallet', 'Approve USDC', 'Buy Contracts'];

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return `Deploy a wallet contract. This is a once-off operation`;
      case 1:
        return 'Approve USDC. This is a once-off operation';
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
      <Grid container alignItems='stretch' justify='center' spacing={2}>
        <Grid item xs={12}>
          <Typography style={{ fontWeight: 'bold' }}>Buy Mining Rewards</Typography>
        </Grid>
        <Grid item xs={12}>
          <Tabs
            value={buyType}
            onChange={handleChangeBuyType}
            indicatorColor="secondary"
            variant="fullWidth"
            textColor="primary"
            scrollButtons="auto" >
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
                step: 0.000001
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
          <Grid item xs={2} className={classes.rightAlign}>
            <Typography style={{ fontWeight: 'bold' }} color='secondary'>USDC</Typography>
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
          <Grid item xs={2} className={classes.rightAlign}>
            <Typography style={{ fontWeight: 'bold' }} color='secondary'>TH</Typography>
          </Grid>
        </TabPanel>
        <Grid item xs={12} container >
          <Paper className={clsx(classes.orderSummary, {
            [classes.orderSummaryBlur]: !isValid,
          })}>
            <Typography align='center'><strong>Order Summary</strong></Typography>
            <Table size='small'>
              <TableBody>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell align='right'>{`$ ${orderValue.toLocaleString()}`}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Quantity</TableCell>
                  <TableCell align='right'>{`${orderQuantity.toLocaleString()} TH`}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Contract Duration</TableCell>
                  <TableCell align='right'>{CONTRACT_DURATION} days</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Price</TableCell>
                  <TableCell align='right'>$ {hashPrice.toFixed(PAYMENT_TOKEN_DECIMALS)} /TH/day</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
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
            You will pay <strong>${orderValue.toLocaleString()}</strong> to buy <strong>{orderQuantity} Th</strong> of hashrate
            for <strong>{CONTRACT_DURATION} days</strong> for <strong>${hashPrice.toLocaleString()}/Th/day</strong>. You will
            receive the average value of the <Link component={RouterLink} to="#" underline='always' onClick={() => setShowMRIInformationModal(true)}>Mining Revenue Index</Link>&nbsp;
            over <strong>{CONTRACT_DURATION} days </strong>representing <strong>{orderQuantity} Th</strong> of mining power per
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
                      disabled={isTxActive}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleStepperNext(activeStep)}
                      className={classes.button}
                      disabled={isTxActive}>
                      {getStepButtonLabel(activeStep)}&nbsp;
                        {isTxActive && <CircularProgress className={classes.loadingSpinner} size={20} />}
                    </Button>
                  </div>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
      </Dialog>
      <ContractSpecificationModal open={showContractSpecificationModal} onClose={() => setShowContractSpecificationModal(false)}/>
      <MRIInformationModal open={showMRIInformationModal} onClose={() => setShowMRIInformationModal(false)}/>
    
    </>
  )
}
export default BuyContractPage;
