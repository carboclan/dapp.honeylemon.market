import React from 'react';
import { Dialog, DialogTitle, DialogContent, TableRow, Table, TableCell, TableBody, Link, Typography } from '@material-ui/core';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import { BigNumber } from '@0x/utils';
import dayjs from 'dayjs';
import { networkName } from '../helpers/ethereumNetworkUtils';
import { useOnboard } from '../contexts/OnboardContext';
import { displayAddress } from '../helpers/displayAddress';

interface ActiveLongPositionModalProps {
  open: boolean,
  onClose(): void,
  position: any,
};

const ActiveLongPositionModal: React.SFC<ActiveLongPositionModalProps> = ({ open, onClose, position }) => {
  const { PAYMENT_TOKEN_DECIMALS, PAYMENT_TOKEN_NAME, COLLATERAL_TOKEN_NAME, COLLATERAL_TOKEN_DECIMALS, CONTRACT_DURATION } = useHoneylemon();
  const { network } = useOnboard();
  const etherscanUrl = (network === 1) ? 'https://etherscan.io' : `https://${networkName(network)}.etherscan.io`
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
              <TableCell>Revenue Accrued</TableCell>
              <TableCell align='right'>{position.pendingReward.toLocaleString(undefined, { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS })} {COLLATERAL_TOKEN_NAME}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2}>
                <Typography variant='caption'>
                  Your transaction was executed on Ethereum blockchain, check 
                  on <Link href={`${etherscanUrl}/tx/${position.transaction.id}`} target="_blank" rel='noopener' underline='always'>Etherscan</Link>: {`${displayAddress(position.transaction.id, 20)}`}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent >
    </Dialog >
  )
}

export default ActiveLongPositionModal;
