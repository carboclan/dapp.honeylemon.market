import React from 'react';
import { makeStyles, Dialog, DialogTitle, DialogContent, TableRow, Table, TableCell, TableBody } from '@material-ui/core';
import { useHoneylemon, PositionStatus } from '../contexts/HoneylemonContext';
import { BigNumber } from '@0x/utils';
import dayjs from 'dayjs';

const useStyles = makeStyles(() => ({

}))

interface ExpiredShortPositionModalProps {
  open: boolean,
  onClose(): void,
  position: any,
};

const ExpiredShortPositionModal: React.SFC<ExpiredShortPositionModalProps> = ({ open, onClose, position }) => {
  const { PAYMENT_TOKEN_DECIMALS, PAYMENT_TOKEN_NAME, COLLATERAL_TOKEN_NAME, COLLATERAL_TOKEN_DECIMALS } = useHoneylemon();
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="dialog-title" maxWidth='sm' fullWidth>
      <DialogTitle id="dialog-title">Expired Short Position Details</DialogTitle>
      <DialogContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Contract</TableCell>
              <TableCell>{position?.instrumentName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Start Date <br />
                Expiration Date <br />
                {position.status === PositionStatus.expiredAwaitingSettlement && <>Time till Settlement <br /></>}
                Settlement Date
              </TableCell>
              <TableCell align='right'>
                {dayjs(position.startDate).format('DD-MMM-YY')} <br />
                {dayjs(position.expirationDate).format('DD-MMM-YY')} <br />
                {position.status === PositionStatus.expiredAwaitingSettlement && <>{Math.ceil(dayjs().utc().diff(dayjs(position.settlementDate), 'h', true))} <br /></>}
                {dayjs(position.settlementDate).format('DD-MMM-YY')} <br />
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
              <TableCell>Paid</TableCell>
              <TableCell align='right'>
                {(position.totalCollateralLocked - position.finalReward).toLocaleString(undefined, { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS })} {COLLATERAL_TOKEN_NAME}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Remaining Collateral</TableCell>
              <TableCell align='right'>
                {position.finalReward.toLocaleString(undefined, { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS })} {COLLATERAL_TOKEN_NAME}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent >
    </Dialog >
  )
}

export default ExpiredShortPositionModal;
