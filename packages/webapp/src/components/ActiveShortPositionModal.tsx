import React from 'react';
import { makeStyles, Dialog, DialogTitle, DialogContent, TableRow, TableHead, Table, TableCell, TableBody, Typography, Grid } from '@material-ui/core';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import { BigNumber } from '@0x/utils';
import dayjs from 'dayjs';

const useStyles = makeStyles(({ palette }) => ({

}))

interface ActiveShortPositionModalProps {
  open: boolean,
  onClose(): void,
  position: any,
};

const ActiveShortPositionModal: React.SFC<ActiveShortPositionModalProps> = ({ open, onClose, position }) => {
  const classes = useStyles();
  const { PAYMENT_TOKEN_DECIMALS, PAYMENT_TOKEN_NAME, COLLATERAL_TOKEN_NAME, COLLATERAL_TOKEN_DECIMALS } = useHoneylemon();
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="dialog-title" maxWidth='sm' fullWidth>
      <DialogTitle id="dialog-title">Active Short Position Details</DialogTitle>
      <DialogContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Contract</TableCell>
              <TableCell>{position.instrumentName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Start Date <br />
                Expiration Date <br />
                Settlement Date <br />
                Days till Expiration
              </TableCell>
              <TableCell align='right'>
                {dayjs(position.startDate).format('DD-MMM-YY')} <br />
                {dayjs(position.expirationDate).format('DD-MMM-YY')} <br />
                {dayjs(position.settlementDate).format('DD-MMM-YY')} <br />
                {position.daysToExpiration}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Price ($/TH) <br />
                Quantity (TH)
              </TableCell>
              <TableCell align='right'>
                {new BigNumber(position.price).toPrecision(PAYMENT_TOKEN_DECIMALS)} <br />
                {position.qtyToMint.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Received ({PAYMENT_TOKEN_NAME})</TableCell>
              <TableCell align='right'>$ {position.totalCost.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Collateral Locked <br />
                Collateral Payable <br />
                Remaining Collateral <br />
              </TableCell>
              <TableCell align='right'>
                {position.totalCollateralLocked.toLocaleString(undefined, { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS })} {COLLATERAL_TOKEN_NAME} <br />
                {(position.totalCollateralLocked - position.pendingReward).toLocaleString(undefined, { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS })} {COLLATERAL_TOKEN_NAME} <br />
                {position.pendingReward.toLocaleString(undefined, { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS })} {COLLATERAL_TOKEN_NAME}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent >
    </Dialog >
  )
}

export default ActiveShortPositionModal;
