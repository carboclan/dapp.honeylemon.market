import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, TableRow, Table, TableCell, TableBody, Button, CircularProgress, makeStyles, Grid } from '@material-ui/core';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import dayjs from 'dayjs';
import { useOnboard } from '../contexts/OnboardContext';
import { COLLATERAL_TOKEN_DECIMALS } from '@honeylemon/honeylemonjs/lib/src';
import * as Sentry from '@sentry/react';

const useStyles = makeStyles(({ spacing, palette }) => ({
  loadingSpinner: {
    width: 20,
    flexBasis: 'end',
    flexGrow: 0,
    color: palette.primary.main,
  },
  cancelButton: {
    alignSelf: "center",
    backgroundColor: palette.secondary.main,
  }
}))

interface UnfilledOfferModalProps {
  open: boolean,
  onClose(): void,
  offer: any,
};

const UnfilledOfferModal: React.SFC<UnfilledOfferModalProps> = ({ open, onClose, offer }: UnfilledOfferModalProps) => {
  const {
    PAYMENT_TOKEN_DECIMALS,
    honeylemonService,
    CONTRACT_DURATION,
    CONTRACT_COLLATERAL_RATIO,
    COLLATERAL_TOKEN_NAME,
    portfolioData: {
      openOrders
    },
    refreshPortfolio,
    marketData: {
      currentMRI
    }
  } = useHoneylemon();
  const { address, gasPrice } = useOnboard();
  const classes = useStyles();

  const [isCancelling, setIsCancelling] = useState(false);
  const offerData = offer && openOrders?.[offer.orderHash];

  const cancelOpenOrder = async (orderHash: string) => {
    const order = openOrders?.[orderHash];
    if (!order) {
      console.log('This order does not exist.')
      return;
    }
    setIsCancelling(true);

    try {
      const cancelTx = honeylemonService.getCancelOrderTx(order)
      const gas = await cancelTx.estimateGasAsync({ from: address })
      const price = Number(`${gasPrice}e9`);
      await cancelTx.awaitTransactionSuccessAsync({
        from: address,
        gas,
        gasPrice: price
      });
      await new Promise(resolve => {
        setTimeout(refreshPortfolio, 5000);
        resolve();
      })
      onClose();
    } catch (error) {
      console.log(error)
      Sentry.captureException(error);
    }
    setIsCancelling(false)
  }

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="dialog-title" maxWidth='sm' fullWidth>
      <DialogTitle id="dialog-title">Unfilled Offer Details</DialogTitle>
      <DialogContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                Limit Price
              </TableCell>
              <TableCell align='right'>
                ${Number(offer?.price.dividedBy(CONTRACT_DURATION).toString()).toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}/TH/Day
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Contract Duration
              </TableCell>
              <TableCell align='right'>
                {CONTRACT_DURATION} Days
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Quantity
              </TableCell>
              <TableCell align='right'>
                {offer?.remainingFillableMakerAssetAmount.toLocaleString()} TH
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Contract Total
              </TableCell>
              <TableCell align='right'>
                $ {(offer?.price * offer?.remainingFillableMakerAssetAmount).toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Estimated Collateral</TableCell>
              <TableCell align='right'>
                {(currentMRI *
                  offer?.remainingFillableMakerAssetAmount *
                  CONTRACT_DURATION *
                  CONTRACT_COLLATERAL_RATIO).toLocaleString(
                    undefined,
                    {
                      maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS
                    })
                } {COLLATERAL_TOKEN_NAME}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Listing Date</TableCell>
              <TableCell align='right'>{dayjs(offerData?.listingDate).format('DD-MMM-YY HH:mm')}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Offer Valid Till</TableCell>
              <TableCell align='right'>{dayjs(offerData?.expirationDate).format('DD-MMM-YY HH:mm')}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Grid container justify='center' spacing={2} style={{ padding: 16 }}>
          <Grid item>
            <Button onClick={() => cancelOpenOrder(offer?.orderHash)} disabled={isCancelling} className={classes.cancelButton} fullWidth>
              Cancel Offer &nbsp;
                {isCancelling && <CircularProgress className={classes.loadingSpinner} size={20} />}
            </Button>
          </Grid>
        </Grid>
      </DialogContent >
    </Dialog >
  )
}

export default UnfilledOfferModal;
