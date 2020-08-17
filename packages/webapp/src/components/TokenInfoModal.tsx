import React from "react";
import { Dialog, DialogContent, Typography, Link, DialogTitle } from "@material-ui/core";
import { OpenInNew } from "@material-ui/icons";
import { useHoneylemon } from "../contexts/HoneylemonContext";

interface TokenInfoModalProps {
  open: boolean;
  onClose(): void;
}

const TokenInfoModal: React.SFC<TokenInfoModalProps> = ({
  open,
  onClose
}: TokenInfoModalProps) => {
  const { COLLATERAL_TOKEN_NAME, PAYMENT_TOKEN_NAME } = useHoneylemon();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Manage My Wallet</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Honeylemon Mining Revenue Contracts are traded in {PAYMENT_TOKEN_NAME}, settled
          in {COLLATERAL_TOKEN_NAME}, and requires ETH for{" "}
          <Link href="https://docs.honeylemon.market/fees">
            fees.
            <OpenInNew fontSize="small" />
          </Link>
          Honeylemon plans to support more BTC & stable coins, and more contracts in the
          future. <br />• <b>{PAYMENT_TOKEN_NAME}</b> is a ERC-20 token representation of
          US Dollar on Ethereum, issued by Tether.
          <br />• <b>{COLLATERAL_TOKEN_NAME}</b> is a ERC-20 token representation of BTC
          on Ethereum, issued by WBTC DAO.
          <br />
        </Typography>
        <br />
        <br />
        <Typography variant="subtitle2">
          <b>Ways to Get More Tokens</b>
        </Typography>
        <Typography variant="subtitle2">
          <b>BUY CONTRACT</b> - Get {PAYMENT_TOKEN_NAME} & ETH:
        </Typography>
        <Typography variant="body2">
          • Decentralized exchanges of your choice:
          <br /> • Visit{" "}
          <Link
            href="https://tokenlon.im/"
            target="_blank"
            rel="noopener"
            underline="always"
          >
            tokenlon.im
            <OpenInNew fontSize="small" />
          </Link>
          , or use Tokenlon directly from your{" "}
          <Link
            href="https://www.token.im/"
            target="_blank"
            rel="noopener"
            underline="always"
          >
            imToken wallet app
            <OpenInNew fontSize="small" />
          </Link>
          , go to “Market” tab
          <br /> • Aggregators:{" "}
          <Link
            href="https://1inch.exchange/#"
            target="_blank"
            rel="noopener"
            underline="always"
          >
            1inch.exchange
            <OpenInNew fontSize="small" />
          </Link>
          , or{" "}
          <Link href="https://dex.ag/" target="_blank" rel="noopener" underline="always">
            Dex.ag
            <OpenInNew fontSize="small" />
          </Link>
          <br />• Centralized exchanges, such as{" "}
          <Link
            href="https://www.binance.com/en"
            target="_blank"
            rel="noopener"
            underline="always"
          >
            Binance
            <OpenInNew fontSize="small" />
          </Link>
        </Typography>
        <br />
        <Typography variant="subtitle2">
          <b>OFFER CONTRACT</b> - Get {COLLATERAL_TOKEN_NAME} and ETH:
        </Typography>
        <Typography variant="body2">
          • Visit{" "}
          <Link
            href="https://tokenlon.im/"
            target="_blank"
            rel="noopener"
            underline="always"
          >
            tokenlon.im
            <OpenInNew fontSize="small" />
          </Link>
          , or use Tokenlon directly from your{" "}
          <Link
            href="https://www.token.im/"
            target="_blank"
            rel="noopener"
            underline="always"
          >
            imToken wallet app
            <OpenInNew fontSize="small" />
          </Link>
          , go to “Market” tab
          <br />• Mint {COLLATERAL_TOKEN_NAME} directly with your BTC on{" "}
          <Link
            href="https://wbtc.cafe/"
            target="_blank"
            rel="noopener"
            underline="always"
          >
            wBTC.cafe
            <OpenInNew fontSize="small" />
          </Link>
        </Typography>
        <br />
        <Typography variant="subtitle2">
          <b>
            MINT {COLLATERAL_TOKEN_NAME} from BTC or REDEEM BTC from{" "}
            {COLLATERAL_TOKEN_NAME}:
          </b>
        </Typography>
        <Typography variant="body2">
          • Mint {COLLATERAL_TOKEN_NAME} directly with your BTC on{" "}
          <Link
            href="https://wbtc.cafe/"
            target="_blank"
            rel="noopener"
            underline="always"
          >
            wBTC.cafe
            <OpenInNew fontSize="small" />
          </Link>{" "}
          and select <b>Get wBTC</b> <br />• Redeem your {COLLATERAL_TOKEN_NAME} for BTC
          on{" "}
          <Link
            href="https://wbtc.cafe/"
            target="_blank"
            rel="noopener"
            underline="always"
          >
            wBTC.cafe
            <OpenInNew fontSize="small" />
          </Link>{" "}
          and select <b>Get BTC</b> <br />• Minting and redeeming {COLLATERAL_TOKEN_NAME}{" "}
          is subject to wBTC.cafe terms and conditions.
        </Typography>
        <br />
        <Typography variant="subtitle2">
          <b>
            ETH, {COLLATERAL_TOKEN_NAME} & {PAYMENT_TOKEN_NAME} Token Balance & Permission
          </b>
        </Typography>
        <Typography variant="body2">
          • Your current balance for ETH, {COLLATERAL_TOKEN_NAME} and {PAYMENT_TOKEN_NAME}{" "}
          of your connected wallet is displayed on the Side Menu.
          <br />• “Approve” {COLLATERAL_TOKEN_NAME} and/or {PAYMENT_TOKEN_NAME} when you
          place an order means you have granted permission to Honeylemon smart contracts
          to access your tokens.
          <br />
          • Permission to access your ETH is by default set to ON due to Ethereum
          transaction fee (gas) consideration.
          <br />• To manually turn ON/OFF permission, simply click on the switch knob.
          Changing permissions will cost additional gas (in ETH).
        </Typography>
        <br />
        <Typography variant="subtitle2">
          <b>Create Honeylemon Vault</b>
        </Typography>
        <Typography variant="body2">
          • If you may use Honeylemon more than once or have multiple orders, Create
          Honeylemon Vault can reduce gas costs and streamline user experience.
          <br />• Create Honeylemon Vault triggers deploying a DSProxy contract, which
          holds your long/short position tokens on your behalf.
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default TokenInfoModal;
