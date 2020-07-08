import React from 'react';
import { Dialog, DialogTitle, DialogContent, TableRow, Table, TableCell, TableBody, Grid, Button, CircularProgress, makeStyles, Typography, Link } from '@material-ui/core';
import { useHoneylemon, PositionStatus, PositionType } from '../contexts/HoneylemonContext';
import { BigNumber } from '@0x/utils';
import dayjs from 'dayjs';
import { useOnboard } from '../contexts/OnboardContext';
import { networkName } from '../helpers/ethereumNetworkUtils';
import { displayAddress } from '../helpers/displayAddress';

const useStyles = makeStyles(({ palette }) => ({
  loadingSpinner: {
    width: 20,
    flexBasis: 'end',
    flexGrow: 0,
  },
  withdrawButton: {
    alignSelf: "center",
  }
}))

interface ExpiredLongPositionModalProps {
  open: boolean,
  onClose(): void,
  withdrawPosition(
    positionTokenAddress: string,
    marketContractAddress: string,
    amount: string,
    type: PositionType): Promise<void>,
  isWithdrawing: boolean
  position: any,
};

const ExpiredLongPositionModal: React.SFC<ExpiredLongPositionModalProps> = ({ open, onClose, position, isWithdrawing, withdrawPosition }) => {
  const { PAYMENT_TOKEN_DECIMALS, PAYMENT_TOKEN_NAME, COLLATERAL_TOKEN_NAME, COLLATERAL_TOKEN_DECIMALS, refreshPortfolio } = useHoneylemon();
  const { network } = useOnboard();

  const etherscanUrl = (network === 1) ? 'https://etherscan.io' : `https://${networkName(network)}.etherscan.io`
  const classes = useStyles();

  const handleWithdraw = async (
    positionTokenAddress: string,
    marketContractAddress: string,
    amount: string,
    type: PositionType
  ) => {
    try {
      await withdrawPosition(positionTokenAddress, marketContractAddress, amount, type);
      refreshPortfolio();
    } catch (error) {
      console.log('Error withdrawing');
    }
  }

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="dialog-title" maxWidth='sm' fullWidth>
      <DialogTitle id="dialog-title">Expired Long Position Details</DialogTitle>
      <DialogContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Contract Position</TableCell>
              <TableCell align='right'>{position.contractName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Start Date <br />
                Expiration Date <br />
                {position.status === PositionStatus.expiredAwaitingSettlement && <>Time till Settlement <br /></>}
                Settlement Date <br />
              </TableCell>
              <TableCell align='right'>
                {dayjs(position.startDate).format('DD-MMM-YY')} <br />
                {dayjs(position.expirationDate).format('DD-MMM-YY')} <br />
                {position.status === PositionStatus.expiredAwaitingSettlement && <>{Math.ceil(dayjs(position.settlementDate).diff(dayjs(), 'h', true))} hour(s)<br /></>}
                {dayjs(position.settlementDate).format('DD-MMM-YY')} <br />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Price<br />
                Quantity
              </TableCell>
              <TableCell align='right'>
                $ {new BigNumber(position.price).toPrecision(PAYMENT_TOKEN_DECIMALS)} /TH/Day<br />
                {position.qtyToMint.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })} TH
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Cost</TableCell>
              <TableCell align='right'>$ {position.totalCost.toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })} {PAYMENT_TOKEN_NAME}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Received</TableCell>
              <TableCell align='right'>{position.pendingReward.toLocaleString(undefined, { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS })} {COLLATERAL_TOKEN_NAME}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell align='right'>{position.status}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2}>
                <Typography>
                  Your transaction was executed on Ethereum blockchain, check 
                  on <Link href={`${etherscanUrl}/tx/${position.transaction.id}`} target="_blank" rel='noopener' underline='always'>Etherscan</Link>: {`${displayAddress(position.transaction.id, 20)}`}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        {position.status === PositionStatus.withdrawalPending && !position.canBeBatchRedeemed &&
          <Grid container justify='center' spacing={2} style={{ padding: 16 }}>
            <Grid item>
              <Button
                variant='contained'
                color='primary'
                onClick={() =>
                  handleWithdraw(
                    position.longTokenAddress,
                    position.contract.id,
                    position.qtyToMint,
                    position.type
                  )}
                disabled={isWithdrawing} className={classes.withdrawButton} fullWidth>
                Withdraw&nbsp;
                {isWithdrawing && <CircularProgress className={classes.loadingSpinner} size={20} />}
              </Button>
            </Grid>
          </Grid>}
      </DialogContent >
    </Dialog >
  )
}

export default ExpiredLongPositionModal;
