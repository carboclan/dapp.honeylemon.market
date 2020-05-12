import React from 'react';
import { Grid, Button } from '@material-ui/core';
import { forwardTo } from '../helpers/history';
import { useOnboard } from '../contexts/OnboardContext';
import { RouteComponentProps, useLocation } from 'react-router';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const LandingPage: React.SFC = () => {
  let query = useQuery();

  const { wallet, onboard, checkIsReady } = useOnboard();
  return (
    <Grid container justify='center' alignContent='center'>
      {!wallet?.provider && (
        <Button onClick={() => onboard?.walletSelect()}>
          Select a Wallet
        </Button>
      )}

      {wallet?.provider && (
        <Button onClick={async () => {
          const walletCheck = await checkIsReady();
          if (walletCheck) {forwardTo(query.get("redirectTo") || '/home') }}}>
          Connect Wallet
        </Button>
      )}
    </Grid>
  )
}

export default LandingPage;
