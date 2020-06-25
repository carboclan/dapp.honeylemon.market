import React from 'react';
import { Dialog, DialogTitle, DialogContent, TableRow, TableHead, Table, TableCell, TableBody, Typography } from '@material-ui/core';
import { useHoneylemon } from '../contexts/HoneylemonContext';

interface OrderbookModalProps {
  open: boolean,
  onClose(): void,
};

const OrderbookModal: React.SFC<OrderbookModalProps> = ({ open, onClose }: OrderbookModalProps) => {
  const { orderbook, PAYMENT_TOKEN_DECIMALS, CONTRACT_DURATION } = useHoneylemon();
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="dialog-title" maxWidth='sm' fullWidth>
      <DialogTitle id="dialog-title">Order Book (Offers Only)</DialogTitle>
      <DialogContent>
        <Typography>
          Miners can make offers and cancel before the listed offer is filled.<br />
          Buyers are not able to bid, buy orders will be filled by best available offers.
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Price ($/TH/Day)</TableCell>
              <TableCell align='center'>Duration (Days)</TableCell>
              <TableCell align='right'>Quantity (TH)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orderbook.map((order, i) =>
              <TableRow key={i}>
                <TableCell>{order.price.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}</TableCell>
                <TableCell align='center'>CONTRACT_DURATION</TableCell>
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
