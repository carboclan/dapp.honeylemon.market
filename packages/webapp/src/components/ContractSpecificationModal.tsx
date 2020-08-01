import React from "react";
import { Typography, Dialog, DialogTitle, DialogContent, Link } from "@material-ui/core";
import { OpenInNew } from "@material-ui/icons";
import { useHoneylemon } from "../contexts/HoneylemonContext";
import { Trans } from "@lingui/macro";

interface ContractSpecificationModalProps {
  open: boolean;
  onClose(): void;
}

const ContractSpecificationModal: React.SFC<ContractSpecificationModalProps> = ({
  open,
  onClose
}: ContractSpecificationModalProps) => {
  const { COLLATERAL_TOKEN_NAME, PAYMENT_TOKEN_NAME } = useHoneylemon();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="dialog-title">
        <Trans>Contract Specification</Trans>
      </DialogTitle>
      <DialogContent>
        <Typography variant="h6">
          <Trans>Description</Trans>
        </Typography>
        <Typography variant="body2" paragraph>
          <Trans>
            A BTC Mining Revenue Contract represents the amount of Bitcoin earned with 1
            terahash (TH) of hashpower per day for 28 days.
          </Trans>
        </Typography>

        <Typography variant="h6">
          <Trans>Trading Currency</Trans>
        </Typography>
        <Typography variant="body2" paragraph>
          <Trans>
            BTC Mining Revenue Contracts are bought and sold in {PAYMENT_TOKEN_NAME}.
          </Trans>
        </Typography>

        <Typography variant="h6">
          <Trans>Settlement Currency</Trans>
        </Typography>
        <Typography variant="body2" paragraph>
          <Trans>
            The BTC Mining Revenue Index (MRI_BTC) is denominated in BTC. The contract is
            collateralized and settled in {COLLATERAL_TOKEN_NAME}. The BTC/
            {COLLATERAL_TOKEN_NAME} precision is 1 satoshi or 1e-8.
          </Trans>
        </Typography>

        <Typography variant="h6">
          <Trans>Tick Size</Trans>
        </Typography>
        <Typography variant="body2" paragraph>
          <Trans>1e-6 {PAYMENT_TOKEN_NAME} is the minimum price movement.</Trans>
        </Typography>

        <Typography variant="h6">
          <Trans>Contract Size</Trans>
        </Typography>
        <Typography variant="body2" paragraph>
          <Trans>
            1 TH (per day for 28 days) is the minimum increment of contract size.
          </Trans>
        </Typography>

        <Typography variant="h6">
          <Trans>Cap Price</Trans>
        </Typography>
        <Typography variant="body2" paragraph>
          <Trans>
            125% of the last updated MRI_BTC when a contract offer is taken, denominated
            in {COLLATERAL_TOKEN_NAME}. <br />
            Cap price determines the collateral requirement for issuance of short
            positions, and caps the maximum settlement value for long positions.
          </Trans>
        </Typography>

        <Typography variant="h6">
          <Trans>Collateral Requirement</Trans>
        </Typography>
        <Typography variant="body2" paragraph>
          <Trans>
            Long position collateral: a buyer pays {PAYMENT_TOKEN_NAME} upfront without
            the need for actual collateral. <br />
            The upfront cost in {PAYMENT_TOKEN_NAME} = entry price * quantity.
            <br />
            <br />
            Short position collateral: a seller is required to set aside a certain amount
            of {COLLATERAL_TOKEN_NAME}
            as collateral in the smart contract until the position is closed or when the
            MRI_BTC contract is settled.
            <br />
            The collateral required in {COLLATERAL_TOKEN_NAME} = cap price * quantity.
            <br />
            <br />
            There is NO margin call or forced liquidation.
          </Trans>
        </Typography>

        <Typography variant="h6">
          <Trans>Contract Start</Trans>
        </Typography>
        <Typography variant="body2" paragraph>
          <Trans>
            The timestamp the contract starts to trade (i.e. UTC 00:01 of the contract
            issue date)
          </Trans>
        </Typography>

        <Typography variant="h6">
          <Trans>Contract Expiration</Trans>
        </Typography>
        <Typography variant="body2" paragraph>
          <Trans>
            The timestamp the contract stops trading (i.e. UTC 00:01 of the expiration
            date)
          </Trans>
        </Typography>

        <Typography variant="h6">
          <Trans>Settlement Value</Trans>
        </Typography>
        <Typography variant="body2" paragraph>
          <Trans>
            Long settlement value = MAX(MRI_BTC_28 at contract expiration, cap price) * 28
            days.
            <br />
            Short settlement value = (cap price - MRI_BTC_28 at contract expiration) * 28
            days.
            <br />
            The earlier time of the two:
            <br />
            • 24-hours after contract expiration;
            <br />
            • The unlikely event of a cap price breach before expiration.
            <br />
          </Trans>
        </Typography>

        <Typography variant="h6">
          <Trans>Settlement Time</Trans>
        </Typography>
        <Typography variant="body2" paragraph>
          <Trans>24 hours after contract expiration.</Trans>
        </Typography>

        <Typography variant="h6">
          <Trans>Arbitration</Trans>
        </Typography>
        <Typography variant="body2" paragraph>
          <Trans>
            The process of updating settlement value in event of settlement value in
            dispute.
          </Trans>
        </Typography>

        <Typography variant="h6">
          <Trans>Withdrawal Period</Trans>
        </Typography>
        <Typography variant="body2" paragraph>
          <Trans>
            Buyers and sellers may withdraw their settlement value after settlement.
          </Trans>
        </Typography>

        <Typography variant="h6">
          <Trans>Token Naming Method</Trans>
        </Typography>
        <Typography variant="body2" paragraph>
          <Trans>
            Long/short positions are represented as ERC20 tokens, named in the following
            format: <br />
            index name-token symbol-forward length-start date-direction. <br /> <br />
            For example, the long and short position tokens of a 28-Day BTC Mining Revenue
            Contract starting on June 1, 2020 and expiring on June 28, 2020 are,
            respectively named <br />
            MRI-BTC-28D-20200601-Long <br />
            MRI-BTC-28D-20200601-Short <br /> <br />
            Long and short position tokens are fungible within the same MRI_BTC contract.&nbsp;
            <br />
            Each position token represents 1TH/Day of hashpower till contract expiration.&nbsp;
            <br />
          </Trans>
        </Typography>

        <Typography variant="h6">
          <Trans>Protocols</Trans>
        </Typography>
        <Typography variant="body2" paragraph>
          <Trans>Market Protocol + 0x Protocol</Trans>
        </Typography>
        <br />
        <br />
        <Link
          href="https://docs.honeylemon.market/btc-mining-revenue-contract-1#contract-specifications"
          target="_blank"
          rel="noopener"
          underline="always"
        >
          <Trans>For more details, please refer to Honeylemon Documentation.</Trans>
          <OpenInNew fontSize="small" />
        </Link>
      </DialogContent>
    </Dialog>
  );
};

export default ContractSpecificationModal;
