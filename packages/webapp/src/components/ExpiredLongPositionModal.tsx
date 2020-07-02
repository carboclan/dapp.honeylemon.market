import React from 'react';
import { Dialog, DialogTitle, DialogContent, TableRow, Table, TableCell, TableBody, Grid, Button, CircularProgress, makeStyles } from '@material-ui/core';
import { useHoneylemon, PositionStatus, PositionType } from '../contexts/HoneylemonContext';
import { BigNumber } from '@0x/utils';
import dayjs from 'dayjs';

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
    amount: number,
    type: PositionType): Promise<void>,
  isWithdrawing: boolean
  position: any,
};

const ExpiredLongPositionModal: React.SFC<ExpiredLongPositionModalProps> = ({ open, onClose, position, isWithdrawing, withdrawPosition }) => {
  const { PAYMENT_TOKEN_DECIMALS, PAYMENT_TOKEN_NAME, COLLATERAL_TOKEN_NAME, COLLATERAL_TOKEN_DECIMALS, refreshPortfolio } = useHoneylemon();
  const classes = useStyles();

  const handleWithdraw = async (
    positionTokenAddress: string,
    marketContractAddress: string,
    amount: number,
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
                {position.status === PositionStatus.expiredAwaitingSettlement && <>{Math.ceil(dayjs().utc().diff(dayjs(position.settlementDate), 'h', true))} <br /></>}
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
          </TableBody>
        </Table>
        {position.status === PositionStatus.withdrawalPending && !position.canBeBatchRedeemed &&
          <Grid container justify='center' spacing={2} style={{ padding: 16 }}>
            <Grid item>
              <Button onClick={() =>
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
