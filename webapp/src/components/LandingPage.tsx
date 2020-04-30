import React from 'react';
import { useOnboard } from './OnboardContext';
import { forwardTo } from '../history';
import { Grid, Button } from '@material-ui/core';

// const useStyles = makeStyles(theme => ({

// }))

const LandingPage: React.SFC = () => {
  // const classes = useStyles()
  const { wallet, onboard } = useOnboard();
  return (
    <Grid container justify='center' alignContent='center'>
      {!wallet?.provider && (
        <Button onClick={() => onboard?.walletSelect()}>
          Select a Wallet
        </Button>
      )}

      {wallet?.provider && (
        <Button onClick={() => onboard?.walletCheck() && forwardTo('/home')}>
          Connect Wallet
        </Button>
      )}
    </Grid>
  )
}

export default LandingPage;
