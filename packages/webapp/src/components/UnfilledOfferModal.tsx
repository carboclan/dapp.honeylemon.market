import React from 'react';
import { Dialog, DialogTitle, DialogContent, TableRow, Table, TableCell, TableBody } from '@material-ui/core';
import { useHoneylemon } from '../contexts/HoneylemonContext';

interface UnfilledOfferModalProps {
  open: boolean,
  onClose(): void,
  offer: any,
};

const UnfilledOfferModal: React.SFC<UnfilledOfferModalProps> = ({ open, onClose, offer }) => {
  const { PAYMENT_TOKEN_DECIMALS, PAYMENT_TOKEN_NAME, COLLATERAL_TOKEN_NAME, COLLATERAL_TOKEN_DECIMALS, CONTRACT_DURATION } = useHoneylemon();
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="dialog-title" maxWidth='sm' fullWidth>
      <DialogTitle id="dialog-title">Unfilled Offer Details</DialogTitle>
      <DialogContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Listing Date</TableCell>
              <TableCell align='right'>TBC</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Limit Price
              </TableCell>
              <TableCell>
                {offer?.price.dividedBy(CONTRACT_DURATION).toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Duration
              </TableCell>
              <TableCell>
                {CONTRACT_DURATION}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Quantity
              </TableCell>
              <TableCell>
                {offer.remainingFillableMakerAssetAmount.toLocaleString()}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Contract Total
              </TableCell>
              <TableCell align='right'>
                TBC
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Estimated Collateral</TableCell>
              <TableCell align='right'>TBC</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Offer Valid Till</TableCell>
              <TableCell align='right'>TBC</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent >
    </Dialog >
  )
}

export default UnfilledOfferModal;
