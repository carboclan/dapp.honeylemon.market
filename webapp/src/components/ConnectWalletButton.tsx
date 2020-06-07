import React, { useState } from 'react';
import { Button, makeStyles, CircularProgress } from '@material-ui/core';
import { useOnboard } from '../contexts/OnboardContext';

const useStyles = makeStyles(({ palette, spacing }) => ({
  button: {
    backgroundColor: palette.secondary.main,
    color: palette.common.black,
    paddingTop: spacing(2),
    paddingBottom: spacing(2),
  },
  connectSpacer: {
    paddingTop: `${spacing(8)}px !important`,
    textAlign: 'center'
  },
  loadingSpinner: {
    width: 20,
    flexBasis: 'end',
    flexGrow: 0,
    color: palette.secondary.main,
  },
}))

const ConnectWalletButton: React.SFC = () => {
  const { wallet, onboard, checkIsReady } = useOnboard();
  const [isConnecting, setIsConnecting] = useState(false);
  const classes = useStyles();

  const handleSelectWalletAndConnect = async () => {
    setIsConnecting(true);
    if (onboard) {
      let walletReady = !!wallet;
      if (!walletReady) {
        walletReady = await onboard.walletSelect();
      }
      walletReady && await checkIsReady();
    }
    setIsConnecting(false);
  }

  return (
    <Button
      onClick={() => { handleSelectWalletAndConnect() }}
      className={classes.button}
      fullWidth
      disabled={!onboard || isConnecting}>
      Connect wallet &nbsp;
      {isConnecting && <CircularProgress className={classes.loadingSpinner} size={20} />}
    </Button>
  )
}

export default ConnectWalletButton;
