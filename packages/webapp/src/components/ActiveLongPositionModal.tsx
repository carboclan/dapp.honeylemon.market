import React from 'react';
import { Dialog, DialogTitle, DialogContent, TableRow, Table, TableCell, TableBody } from '@material-ui/core';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import { BigNumber } from '@0x/utils';
import dayjs from 'dayjs';

interface ActiveLongPositionModalProps {
  open: boolean,
  onClose(): void,
  position: any,
};

const ActiveLongPositionModal: React.SFC<ActiveLongPositionModalProps> = ({ open, onClose, position }) => {
  const { PAYMENT_TOKEN_DECIMALS, PAYMENT_TOKEN_NAME, COLLATERAL_TOKEN_NAME, COLLATERAL_TOKEN_DECIMALS, CONTRACT_DURATION } = useHoneylemon();
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="dialog-title" maxWidth='sm' fullWidth>
      <DialogTitle id="dialog-title">Active Long Position Details</DialogTitle>
      <DialogContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Contract Position</TableCell>
              <TableCell align='right'>{position.contractName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Start <br />
                Expiration <br />
                Settlement<br />
                Days till Expiration
              </TableCell>
              <TableCell align='right'>
                {dayjs(position.startDate).format('DD-MMM-YY')} <br />
                {dayjs(position.expirationDate).format('DD-MMM-YY')} <br />
                {dayjs(position.settlementDate).format('DD-MMM-YY')} <br />
                {position.daysToExpiration} days
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Price<br />
                Quantity
              </TableCell>
              <TableCell align='right'>
                $ {new BigNumber(position.price).dividedBy(CONTRACT_DURATION).toPrecision(PAYMENT_TOKEN_DECIMALS)} /TH/Day<br />
                {position.qtyToMint.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })} TH
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Cost</TableCell>
              <TableCell align='right'>{position.totalCost.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })} {PAYMENT_TOKEN_NAME}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Receivable</TableCell>
              <TableCell align='right'>{position.pendingReward.toLocaleString(undefined, { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS })} {COLLATERAL_TOKEN_NAME}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent >
    </Dialog >
  )
}

export default ActiveLongPositionModal;
