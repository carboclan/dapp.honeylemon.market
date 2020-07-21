import React, { useState } from "react";
import {
  Button,
  makeStyles,
  CircularProgress,
  Typography,
  Link
} from "@material-ui/core";
import { useOnboard } from "../contexts/OnboardContext";
import { OpenInBrowser, OpenInNew } from "@material-ui/icons";

const useStyles = makeStyles(({ palette, spacing }) => ({
  button: {
    paddingTop: spacing(1),
    paddingBottom: spacing(1),
    fontWeight: "bold"
  },
  loadingSpinner: {
    width: 20,
    flexBasis: "end",
    flexGrow: 0,
    color: palette.primary.main
  }
}));

const ConnectWalletButton: React.SFC = () => {
  const { wallet, onboard, checkIsReady, isReady } = useOnboard();
  const [isConnecting, setIsConnecting] = useState(false);
  const classes = useStyles();

  const handleSelectWalletAndConnect = async () => {
    setIsConnecting(true);
    if (onboard) {
      let walletReady = !!wallet;
      if (!walletReady) {
        walletReady = await onboard.walletSelect();
      }
      walletReady && (await checkIsReady());
    }
    setIsConnecting(false);
  };

  if (!isReady) {
    return (
      <>
        <Typography variant="subtitle2" color="secondary" align="left" paragraph>
          <Link
            href="https://docs.honeylemon.market/audit-report"
            target="_blank"
            rel="noopener"
            color="secondary"
          >
            ⚠️ This is <b>alpha</b> softare. Use at own risk.{" "}
            <OpenInNew fontSize="small" />
          </Link>
        </Typography>
        <Button
          color="primary"
          variant="contained"
          onClick={() => {
            handleSelectWalletAndConnect();
          }}
          className={classes.button}
          fullWidth
          disabled={!onboard || isConnecting}
        >
          CONNECT WALLET TO TRADE&nbsp;
          {isConnecting && (
            <CircularProgress className={classes.loadingSpinner} size={20} />
          )}
        </Button>
      </>
    );
  } else {
    return null;
  }
};

export default ConnectWalletButton;
