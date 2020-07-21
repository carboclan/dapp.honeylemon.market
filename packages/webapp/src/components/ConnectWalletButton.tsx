import React, { useState } from "react";
import { Button, makeStyles, CircularProgress, Typography } from "@material-ui/core";
import { useOnboard } from "../contexts/OnboardContext";

const useStyles = makeStyles(({ palette, spacing }) => ({
  button: {
    paddingTop: spacing(1),
    paddingBottom: spacing(1),
    fontWeight: "bold"
  },
  connectSpacer: {
    paddingTop: `${spacing(8)}px !important`,
    textAlign: "center"
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
          Please note that this is am alpha version of the Honeylemon website which is
          still undergoing final testing before its official release. The website, its
          software and all content found on it are provided on an “as is” and “as
          available” basis. Honeylemon does not give any warranties, whether express or
          implied, as to the suitability or usability of the website, its software or any
          of its content.
        </Typography>
        <Typography variant="subtitle2" color="secondary" align="left" paragraph>
          Honeylemon will not be liable for any loss, whether such loss is direct,
          indirect, special or consequential, suffered by any party as a result of their
          use of the Honeylemon website, its software or content. Any downloading or
          uploading of material to the website is done at the user’s own risk and the user
          will be solely responsible for any damage to any computer system or loss of data
          that results from such activities.
        </Typography>
        <Typography variant="subtitle2" color="secondary" align="left" paragraph>
          Should you encounter any bugs, glitches, lack of functionality or other problems
          on the website, please let us know immediately so we can rectify these
          accordingly. Your help in this regard is greatly appreciated.
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
