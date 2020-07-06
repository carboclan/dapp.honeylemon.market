import React from 'react';
import { Dialog, DialogContent, makeStyles, Typography, Link } from '@material-ui/core';
import { OpenInNew } from '@material-ui/icons';

interface TokenInfoModalProps {
  open: boolean,
  onClose(): void,
};

const TokenInfoModal: React.SFC<TokenInfoModalProps> = ({ open, onClose }: TokenInfoModalProps) => (
  <Dialog open={open} onClose={onClose} aria-labelledby="dialog-title" maxWidth='sm' fullWidth>
    <DialogContent>
      <Typography variant='subtitle1'>
        Manage ETH, imBTC and USDT in your connected wallet:
        </Typography>
      <Typography variant='body2' paragraph>
        • From side menu on Honeylemon dApp, under  “Manage Token Access”, you may view your current balance for ETH, imBTC and USDT.<br />
          • You can view and adjust current permission for Honeylemon smart contracts to access your imBTC and USDT of your connected wallet.<br />
          • You will be prompted to “Approve imBTC” when you list an offer, and prompted to “Approve USDT” when you place a buy order.<br />
          • If the switch knob is shown as ON for both USDT and imBTC, you do not need to separately approve each time you buy or offer contracts.<br />
          • To manually turn ON/OFF permission for Honeylemon smart contract to access your imBTC and USDT balance, simply click on the switch knob.<br />
          • Permission to access ETH balance is by default set to ON for Ethereum transaction fee (gas) consideration. Changing permissions will also cost gas (in ETH).<br />
      </Typography>
      <br />
      <Typography variant='subtitle1'>
        BUY CONTRACT - 3 ways to get USDT and a little bit of ETH:
        </Typography>
      <Typography variant='body2'>
        • Buy USDT and ETH directly from decentralized exchange Tokenlon: <br />
          &nbsp;&nbsp;• Visit <Link href='https://tokenlon.im/' target="_blank" rel='noopener' underline='always'>tokenlon.im<OpenInNew fontSize='small' /></Link>, or <br />
          &nbsp;&nbsp;• Use Tokenlon directly from your <Link href='https://www.token.im/' target="_blank" rel='noopener' underline='always'>imToken wallet app<OpenInNew fontSize='small' /></Link>, go to “Market” tab<br />
          • Get it on popular decentralized exchange aggregators: <br />
          &nbsp;&nbsp;• <Link href='https://1inch.exchange/#' target="_blank" rel='noopener' underline='always'>1inch.exchange<OpenInNew fontSize='small' /></Link>, or <br />
          &nbsp;&nbsp;• <Link href='https://dex.ag/' target="_blank" rel='noopener' underline='always'>Dex.ag<OpenInNew fontSize='small' /></Link><br />
          • Get it on centralized exchanges, such as <Link href='https://www.binance.com/en' target="_blank" rel='noopener' underline='always'>Binance<OpenInNew fontSize='small' /></Link>
      </Typography>
      <br />
      <Typography variant='subtitle1'>
        OFFER CONTRACT - 2 ways to get imBTC and a little bit of ETH:
        </Typography>
      <Typography variant='body2'>
        • Buy imBTC and ETH directly from decentralized exchange Tokenlon: <br />
          &nbsp;&nbsp;• Visit <Link href='https://tokenlon.im/' target="_blank" rel='noopener' underline='always'>tokenlon.im<OpenInNew fontSize='small' /></Link>, or <br />
          &nbsp;&nbsp;• Use Tokenlon directly from your <Link href='https://www.token.im/' target="_blank" rel='noopener' underline='always'>imToken wallet app<OpenInNew fontSize='small' /></Link>, go to “Market” tab<br />
          • Mint imBTC directly with your BTC on <Link href='https://www.token.im/' target="_blank" rel='noopener' underline='always'>imToken wallet app<OpenInNew fontSize='small' /></Link>, go to “Browser” tab, open imBTC dApp.
        </Typography>
      <br />
      <Typography variant='subtitle1'>
        REDEEM imBTC into BTC:
      </Typography>
      <Typography variant='body2'>
        • Redeem imBTC into actual BTC from <Link href='https://www.token.im/' target="_blank" rel='noopener' underline='always'>imToken wallet app<OpenInNew fontSize='small' /></Link>, go to “Browser” tab, open imBTC dApp.
        </Typography>
      <br />
      <Typography variant='subtitle1'>
        Why ETH, imBTC and USDT?:
      </Typography>
      <Typography variant='body2'>
        Honeylemon Mining Revenue Contracts are bought and sold in USDT, settled in imBTC. To trade contract, would also require a bit of ETH in your wallet to pay for <Link href='https://docs.honeylemon.market/fees' target="_blank" rel='noopener' underline='always'>fees<OpenInNew fontSize='small' /></Link><br />
         • USDT is an ERC-20 represntation of US Dollar on Ethereum blockchain, issued by Tether. <br />
         • imBTC is an ERC-20 representation of BTC on Ethereum blockchain, issued by imToken. <br />
      </Typography>
    </DialogContent>
  </Dialog>
)

export default TokenInfoModal;
