import React from 'react';
import { Dialog, DialogTitle, DialogContent, TableRow, TableHead, Table, TableCell, TableBody, Typography } from '@material-ui/core';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import { Trans } from '@lingui/macro';

interface OrderbookModalProps {
  open: boolean,
  onClose(): void,
};

const OrderbookModal: React.SFC<OrderbookModalProps> = ({ open, onClose }: OrderbookModalProps) => {
  const { orderbook, PAYMENT_TOKEN_DECIMALS, CONTRACT_DURATION } = useHoneylemon();
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="dialog-title" maxWidth='sm' fullWidth>
      <DialogTitle id="dialog-title"><Trans>Available Offers</Trans></DialogTitle>
      <DialogContent>
        <Typography>
          <Trans>
          Miners can make offers and cancel before the listed offer is filled.<br />
          Buyers are not able to bid, buy orders will be filled by best available offers.
          </Trans>
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><Trans>Price ($/TH/Day)</Trans></TableCell>
              <TableCell align='center'><Trans>Duration (Days)</Trans></TableCell>
              <TableCell align='right'><Trans>Quantity (TH)</Trans></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orderbook.map((order, i) =>
              <TableRow key={i}>
                <TableCell>{order.price.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}</TableCell>
                <TableCell align='center'>{CONTRACT_DURATION}</TableCell>
                <TableCell align='right'>{order.quantity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}

export default OrderbookModal;
