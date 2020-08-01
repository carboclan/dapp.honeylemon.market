import React from "react";
import { Dialog, DialogContent, Typography, Link, DialogTitle } from "@material-ui/core";
import { OpenInNew } from "@material-ui/icons";
import { useHoneylemon } from "../contexts/HoneylemonContext";
import { Trans } from "@lingui/macro";

interface AboutHoneylemonContractModalProps {
  open: boolean;
  onClose(): void;
}

const AboutHoneylemonContractModal: React.SFC<AboutHoneylemonContractModalProps> = ({
  open,
  onClose
}) => {
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
        <Trans>About Honeylemon Mining Revenue Contract</Trans>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          <Trans>
            • The Honeylemon Mining Revenue Contract is the first of a series of Mining
            Revenue Contracts designed to replicate payoff of existing cloud mining.&nbsp;
            <br />• The Honeylemon 28-Day Mining Revenue Contract is a forward-like
            product that settles to the market-wide block reward and fees per Terahash
            over 28 days as published in the BTC Mining Revenue Index (BTC_MRI_28), with a
            125% max revenue cap for the buyer. See&nbsp;
            <Link href="https://docs.honeylemon.market/btc-mining-revenue-contract-1">
              Contract Specifications
              <OpenInNew fontSize="small" />
            </Link>&nbsp;
            in the Docs.
            <br />• The seller sets the offer price and deposit a collateral in ERC-20
            token representation of BTC ({COLLATERAL_TOKEN_NAME}) upfront and receives
            stable coin payment ({PAYMENT_TOKEN_NAME}) upon offer being taken.
            <br />• The buyer pays a fixed price in stable coin ({PAYMENT_TOKEN_NAME})
            upfront and later receives the mining output in ERC-20 token representation of
            BTC ({COLLATERAL_TOKEN_NAME}) upon contract settlement. <br />• Honeylemon
            Mining Revenue Contracts are executed via a set of Ethereum smart contracts,
            built upon Market Protocol and 0x Protocol v3. Check out our&nbsp;
            <Link href="https://docs.honeylemon.market/technical-architecture">
              Technical Architecture
              <OpenInNew fontSize="small" />
            </Link>&nbsp;
            in Docs.
            <br />
          </Trans>
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default AboutHoneylemonContractModal;
