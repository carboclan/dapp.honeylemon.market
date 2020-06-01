import React, { useState, useEffect } from 'react';
import {
  Button,
  Typography,
  Grid,
  makeStyles,
  FilledInput,
  Link,
  InputAdornment,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@material-ui/core';
import clsx from 'clsx';
import { BigNumber } from '@0x/utils';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import { useOnboard } from '../contexts/OnboardContext';
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
  offerSummary: {
    padding: spacing(2),
    width: '100%'
  },
  offerSummaryBlur: {
    filter: 'blur(2px)',
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
  button: {
    marginTop: spacing(1),
    marginRight: spacing(1),
    color: palette.common.black,
  },
  actionsContainer: {
    marginBottom: spacing(2),
  },
}))

const OfferContractPage: React.SFC = () => {
  const { honeylemonService,
    COLLATERAL_TOKEN_DECIMALS,
    collateralTokenAllowance,
    collateralTokenBalance,
    CONTRACT_DURATION,
    isDsProxyDeployed,
  } = useHoneylemon();
  const { address = '0x' } = useOnboard();
  const classes = useStyles();

  const [hashPrice, setHashPrice] = useState(0);
  const [hashAmount, setHashAmount] = useState(0);
  const [totalContractPrice, setTotalContractPrice] = useState(0);
  const [collateralAmount, setCollateralAmount] = useState(0);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isTxActive, setIsTxActive] = useState(false);

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
    setTotalContractPrice(hashPrice * hashAmount * CONTRACT_DURATION)
  }, [hashPrice, hashAmount, CONTRACT_DURATION])

  useEffect(() => {
    const getCurrentHashPrice = async () => {
      const result = await honeylemonService.getQuoteForSize(new BigNumber(1))
      setHashPrice(Number(result?.price?.dividedBy(CONTRACT_DURATION).toString()) || 0);
    }
    getCurrentHashPrice();
  }, [CONTRACT_DURATION, honeylemonService])

  const tokenApprovalGranted = collateralTokenAllowance > collateralAmount;
  const sufficientCollateral = collateralTokenBalance >= collateralAmount;

  const errors = [];
  !sufficientCollateral && errors.push("You do not have enough imBTC to proceed");

  const handleCloseOfferDialog = () => {
    setShowOfferModal(false);
  }

  const handleDeployDSProxy = async () => {
    setIsTxActive(true);
    try {
      await honeylemonService.deployDSProxyContract(address);
    } catch (error) {
      console.log('Something went wrong deploying the DS Proxy wallet');
      console.log(error);
      // TODO Display error on modal
    }
    setIsTxActive(false);
  }

  const handleApproveCollateralToken = async () => {
    setIsTxActive(true);
    try {
      await honeylemonService.approveCollateralToken(address);
    } catch (error) {
      console.log('Something went wrong approving the tokens');
      console.log(error);
      // TODO Display error on modal
    }
    setIsTxActive(false);
  }

  const handleCreateOffer = async () => {
    setIsTxActive(true);
    try {
      const order = honeylemonService.createOrder(address, new BigNumber(hashAmount), new BigNumber(CONTRACT_DURATION).multipliedBy(hashPrice));
      const signedOrder = await honeylemonService.signOrder(order);
      await honeylemonService.submitOrder(signedOrder);
      setShowOfferModal(false)
      forwardTo('/portfolio')
    } catch (error) {
      console.log('Something went wrong creating the offer');
      console.log(error);
      // TODO: Display error on modal
    }
    setIsTxActive(false);
  }

  const getActiveStep = () => {
    if (!isDsProxyDeployed) return 0;
    if (!tokenApprovalGranted) return 1;
    return 2;
  };

  const activeStep = getActiveStep();

  const steps = ['Deploy Wallet', 'Approve USDC', 'Buy Contracts'];

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return `Deploy a wallet contract. This is a once-off operation`;
      case 1:
        return 'Approve imBTC. This is a once-off operation';
      case 2:
        return `Finalize Offer`;
    }
  }

  const getStepButtonLabel = (step: number) => {
    switch (step) {
      case 0:
        return `Deploy`;
      case 1:
        return 'Approve';
      case 2:
        return `Offer`;
    }
  }

  const handleStepperNext = (step: number) => {
    switch (step) {
      case 0:
        return handleDeployDSProxy();
      case 1:
        return handleApproveCollateralToken();
      case 2:
        return handleCreateOffer();
    }
  }

  const handleStartOffer = () => {
    setShowOfferModal(true);
    activeStep === 2 && handleCreateOffer();
  }

  return (
    <>
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
                setTotalContractPrice(0);
                return;
              }
              const newValue = parseFloat(newValueString);
              !isNaN(newValue) && setHashPrice(newValue);
            }}
            value={hashPrice}
            type='number'
            onBlur={e => {
              e.target.value = e.target.value.replace(/^(-)?0+(0\.|\d)/, '$1$2')
            }}
            disabled={showOfferModal} />
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
              const newValue = parseInt(newValueString);
              !isNaN(newValue) && setHashAmount(newValue);
            }}
            value={hashAmount}
            type='number'
            onBlur={e => {
              e.target.value = e.target.value.replace(/^(-)?0+(0\.|\d)/, '$1$2')
            }}
            disabled={showOfferModal} />
        </Grid>
        <Grid item xs={2} className={classes.rightAlign}>
          <Typography style={{ fontWeight: 'bold' }} color='secondary'>Th</Typography>
        </Grid>
        <Grid item xs={12} container >
          <Paper className={clsx(classes.offerSummary, {
            [classes.offerSummaryBlur]: !sufficientCollateral,
          })}>
            <Typography align='center'><strong>Offer Summary</strong></Typography>
            <Table size='small'>
              <TableBody>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell align='right'>{`$ ${totalContractPrice.toLocaleString()}`}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Collateral Required</TableCell>
                  <TableCell align='right'>{`${collateralAmount.toLocaleString()} imBTC`}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Contract Duration</TableCell>
                  <TableCell align='right'>{CONTRACT_DURATION} days</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Price</TableCell>
                  <TableCell align='right'>$ {hashPrice.toLocaleString()} /TH/day</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Quantity</TableCell>
                  <TableCell align='right'>{hashAmount.toLocaleString()} TH</TableCell>
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
            onClick={handleStartOffer}
            disabled={!sufficientCollateral || showOfferModal}>
            CREATE OFFER &nbsp;
              {showOfferModal && <CircularProgress className={classes.loadingSpinner} size={20} />}
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Typography>
            You will offer <strong>{hashAmount} contracts</strong> at <strong>${hashPrice} Th/day.</strong>. If
            a hodler buys your offer you will receive <strong>${totalContractPrice.toFixed(2)} USDC</strong>. You
            will be required to post the hodlers max win of <strong>{collateralAmount} imBTC</strong> as
            collateral. The amount of that collateral that the hodler receives will be determined by
            the average value of the <Link href='#' underline='always'>Mining Revenue Index</Link> over
            the <strong>{CONTRACT_DURATION} days</strong> starting when the hodler pays you.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>
            See <Link href='#' underline='always'>full contract specification here.</Link>
          </Typography>
        </Grid>
      </Grid>
      <Dialog open={showOfferModal} onClose={handleCloseOfferDialog} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Create Offer</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  <Typography>{getStepContent(index)}</Typography>
                  <div className={classes.actionsContainer}>
                    <Button
                      onClick={handleCloseOfferDialog}
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
    </>
  )
}

export default OfferContractPage;
