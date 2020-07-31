import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TableRow,
  Table,
  TableCell,
  TableBody,
  Typography,
  Link
} from "@material-ui/core";
import {
  useHoneylemon,
  PositionStatus,
  PositionType
} from "../contexts/HoneylemonContext";
import { BigNumber } from "@0x/utils";
import dayjs from "dayjs";
import { useOnboard } from "../contexts/OnboardContext";
import { networkName } from "../helpers/ethereumNetworkUtils";
import { displayAddress } from "../helpers/displayAddress";

interface ExpiredLongPositionModalProps {
  open: boolean;
  onClose(): void;
  withdrawPosition(
    positionTokenAddress: string,
    marketContractAddress: string,
    amount: string,
    type: PositionType
  ): Promise<void>;
  isWithdrawing: boolean;
  position: any;
}

const ExpiredLongPositionModal: React.SFC<ExpiredLongPositionModalProps> = ({
  open,
  onClose,
  position
}) => {
  const {
    PAYMENT_TOKEN_DECIMALS,
    PAYMENT_TOKEN_NAME,
    COLLATERAL_TOKEN_NAME,
    COLLATERAL_TOKEN_DECIMALS
  } = useHoneylemon();
  const { network } = useOnboard();

  const etherscanUrl =
    network === 1
      ? "https://etherscan.io"
      : `https://${networkName(network)}.etherscan.io`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="dialog-title">Expired Long Position Details</DialogTitle>
      <DialogContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Contract Position</TableCell>
              <TableCell align="right">{position.contractName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Start Date <br />
                Expiration Date <br />
                {position.status === PositionStatus.expiredAwaitingSettlement && (
                  <>
                    Time till Settlement <br />
                  </>
                )}
                Settlement Date <br />
              </TableCell>
              <TableCell align="right">
                {dayjs(position.startDate).format("DD-MMM-YY")} <br />
                {dayjs(position.expirationDate).format("DD-MMM-YY")} <br />
                {position.status === PositionStatus.expiredAwaitingSettlement && (
                  <>
                    {Math.ceil(dayjs(position.settlementDate).diff(dayjs(), "h", true))}&nbsp;
                    hour(s)
                    <br />
                  </>
                )}
                {dayjs(position.settlementDate).format("DD-MMM-YY")} <br />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Price
                <br />
                Quantity
              </TableCell>
              <TableCell align="right">
                $ {new BigNumber(position.price).toPrecision(PAYMENT_TOKEN_DECIMALS)}&nbsp;
                /TH/Day
                <br />
                {position.qtyToMint.toLocaleString(undefined, {
                  maximumFractionDigits: PAYMENT_TOKEN_DECIMALS
                })}&nbsp;
                TH
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Cost</TableCell>
              <TableCell align="right">
                $&nbsp;
                {position.totalCost.toLocaleString(undefined, {
                  maximumFractionDigits: PAYMENT_TOKEN_DECIMALS
                })}&nbsp;
                {PAYMENT_TOKEN_NAME}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Received</TableCell>
              <TableCell align="right">
                {position.pendingReward.toLocaleString(undefined, {
                  maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS
                })}&nbsp;
                {COLLATERAL_TOKEN_NAME}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell align="right">{position.status}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2}>
                <Typography variant="caption">
                  Your transaction was executed on Ethereum blockchain, check on&nbsp;
                  <Link
                    href={`${etherscanUrl}/tx/${position.transaction.id}`}
                    target="_blank"
                    rel="noopener"
                    underline="always"
                  >
                    Etherscan
                  </Link>
                  : {`${displayAddress(position.transaction.id, 20)}`}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};

export default ExpiredLongPositionModal;
