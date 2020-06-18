import React from 'react';
import { makeStyles, Dialog, DialogTitle, DialogContent, TableRow, TableHead, Table, TableCell, TableBody } from '@material-ui/core';
import { useHoneylemon } from '../contexts/HoneylemonContext';

const useStyles = makeStyles(({ palette }) => ({

}))

interface OrderbookModalProps {
  open: boolean,
  onClose(): void,
};

const OrderbookModal: React.SFC<OrderbookModalProps> = ({ open, onClose }: OrderbookModalProps) => {
  const classes = useStyles();
  const { orderbook, PAYMENT_TOKEN_DECIMALS } = useHoneylemon();
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="dialog-title" maxWidth='sm' fullWidth>
      <DialogTitle id="dialog-title">Order Book</DialogTitle>
      <DialogContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Price ($/TH/Day)</TableCell>
              <TableCell>Quantity (TH)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orderbook.map((order, i) =>
              <TableRow key={i}>
                <TableCell>$ {order.price.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}</TableCell>
                <TableCell>{order.quantity} TH</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}

export default OrderbookModal;
