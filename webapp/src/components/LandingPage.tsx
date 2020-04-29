import React from 'react';
import { useOnboard } from './OnboardContext';
import { networkName } from '../helpers/ethereumNetworkUtils';

const LandingPage: React.SFC = () => {
  const { wallet, onboard, address, network, balance, notify } = useOnboard();
  return (
    <>
      {!wallet?.provider && (
        <button
          className="bn-demo-button"
          onClick={() => onboard?.walletSelect()}>
          Select a Wallet
        </button>
      )}

      {wallet?.provider && (
        <>
          <div>Hi {address}</div>
          <div>You are using {networkName(network)} network</div>
          <div>You have {balance} eth</div>
          <button className="bn-demo-button" onClick={() => {
            notify.notification({
              message: "Running wallet check"
            })
            onboard?.walletCheck()}}>
            Wallet Checks
          </button>
        </>
      )}
    </>
  )
}

export default LandingPage;
