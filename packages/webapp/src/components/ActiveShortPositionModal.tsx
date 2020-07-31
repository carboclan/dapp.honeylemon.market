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
import { useHoneylemon } from "../contexts/HoneylemonContext";
import { BigNumber } from "@0x/utils";
import dayjs from "dayjs";
import { displayAddress } from "../helpers/displayAddress";
import { useOnboard } from "../contexts/OnboardContext";
import { networkName } from "../helpers/ethereumNetworkUtils";
import { Trans } from "@lingui/macro";

interface ActiveShortPositionModalProps {
  open: boolean;
  onClose(): void;
  position: any;
}

const ActiveShortPositionModal: React.SFC<ActiveShortPositionModalProps> = ({
  open,
  onClose,
  position
}) => {
  const {
    PAYMENT_TOKEN_DECIMALS,
    PAYMENT_TOKEN_NAME,
    COLLATERAL_TOKEN_NAME,
    COLLATERAL_TOKEN_DECIMALS,
    CONTRACT_DURATION
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
      <DialogTitle id="dialog-title">
        <Trans>Active Short Position Details</Trans>
      </DialogTitle>
      <DialogContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <Trans>Contract Position</Trans>
              </TableCell>
              <TableCell align="right">{position.contractName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Trans>
                  Start
                  <br />
                  Expiration
                  <br />
                  Settlement
                  <br />
                  Days till Expiration
                </Trans>
              </TableCell>
              <TableCell align="right">
                {dayjs(position.startDate).format("DD-MMM-YY")} <br />
                {dayjs(position.expirationDate).format("DD-MMM-YY")} <br />
                {dayjs(position.settlementDate).format("DD-MMM-YY")} <br />
                <Trans>{position.daysToExpiration} days</Trans>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Trans>
                  Price
                  <br />
                  Quantity
                </Trans>
              </TableCell>
              <TableCell align="right">
                ${" "}
                {new BigNumber(position.price)
                  .dividedBy(CONTRACT_DURATION)
                  .toPrecision(PAYMENT_TOKEN_DECIMALS)}{" "}
                /TH/Day <br />
                {position.qtyToMint.toLocaleString(undefined, {
                  maximumFractionDigits: PAYMENT_TOKEN_DECIMALS
                })}{" "}
                TH
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Trans>Received</Trans>
              </TableCell>
              <TableCell align="right">
                {position.totalCost.toLocaleString(undefined, {
                  maximumFractionDigits: PAYMENT_TOKEN_DECIMALS
                })}{" "}
                {PAYMENT_TOKEN_NAME}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell align="center" colSpan={2} style={{ borderBottomWidth: 0 }}>
                <Trans>Collateral</Trans>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Trans>
                  Locked
                  <br />
                  Payable
                  <br />
                  Remaining
                  <br />
                </Trans>
              </TableCell>
              <TableCell align="right">
                {position.totalCollateralLocked.toLocaleString(undefined, {
                  maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS
                })}{" "}
                {COLLATERAL_TOKEN_NAME} <br />
                {(position.totalCollateralLocked - position.pendingReward).toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS
                  }
                )}{" "}
                {COLLATERAL_TOKEN_NAME} <br />
                {position.pendingReward.toLocaleString(undefined, {
                  maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS
                })}{" "}
                {COLLATERAL_TOKEN_NAME}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2}>
                <Typography variant="caption">
                  <Trans>
                    Your transaction was executed on Ethereum blockchain, check on{" "}
                    <Link
                      href={`${etherscanUrl}/tx/${position.transaction.id}`}
                      target="_blank"
                      rel="noopener"
                      underline="always"
                    >
                      Etherscan
                    </Link>
                    : {`${displayAddress(position.transaction.id, 20)}`}
                  </Trans>
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};

export default ActiveShortPositionModal;
