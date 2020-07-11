import React from 'react';
import { Dialog, DialogContent, Typography, Link, DialogTitle } from '@material-ui/core';
import { OpenInNew } from '@material-ui/icons';

interface AboutHoneylemonContractModalProps {
  open: boolean,
  onClose(): void,
};

const AboutHoneylemonContractModal: React.SFC<AboutHoneylemonContractModalProps> = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose} aria-labelledby="dialog-title" maxWidth='sm' fullWidth>
    <DialogTitle id='dialog-title'>
      About Honeylemon Mining Revenue Contract
    </DialogTitle>
    <DialogContent>
      <Typography variant='body2'>
      • The Honeylemon Mining Revenue Contract is the first of a series of Mining Revenue Contracts designed to replicate payoff of existing cloud mining. <br/>
      • The Honeylemon 28-Day Mining Revenue Contract is a forward-like product that settles to the market-wide block reward and fees per Terahash over 28 days 
        as published in the BTC Mining Revenue Index (BTC_MRI_28), with a 125% max revenue cap for the buyer. 
        See <Link href='https://docs.honeylemon.market/btc-mining-revenue-contract-1' >Contract Specifications<OpenInNew fontSize='small' /></Link> in the Docs.<br/>
      • The seller sets the offer price and deposit a collateral in ERC-20 token representation of BTC (imBTC) upfront and receives stable coin payment (USDT) upon offer being taken.<br/>
      • The buyer pays a fixed price in stable coin (USDT) upfront and later receives the mining output in ERC-20 token representation of BTC (imBTC) upon contract settlement. <br/>
      • Honeylemon Mining Revenue Contracts are executed via a set of Ethereum smart contracts, built upon Market Protocol and 0x Protocol v3. Check out 
        our <Link href='https://docs.honeylemon.market/technical-architecture'>Technical Architecture<OpenInNew fontSize='small' /></Link> in Docs.<br/>
      </Typography>
    </DialogContent>
  </Dialog>
)

export default AboutHoneylemonContractModal;
