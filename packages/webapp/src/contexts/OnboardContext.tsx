import * as React from 'react';
import { useState, useEffect } from 'react';
import Onboard from 'bnc-onboard';
import Notify from 'bnc-notify';
import { API as OnboardApi, Wallet } from 'bnc-onboard/dist/src/interfaces';
import { API as NotifyApi } from 'bnc-notify/dist/src/interfaces';
import { fromWei } from 'web3-utils';
import FontFaceObserver from 'fontfaceobserver';

import { networkName } from '../helpers/ethereumNetworkUtils';

export type OnboardProviderProps = {
  dappId: string;
  networkId: number;
  children: React.ReactNode;
}

export type OnboardContext = {
  onboard?: OnboardApi,
  address?: string,
  network?: number,
  balance?: number,
  wallet?: Wallet,
  notify?: NotifyApi,
  isReady: boolean,
  checkIsReady(): Promise<boolean>,
  resetOnboard(): void,
}

const OnboardContext = React.createContext<OnboardContext | undefined>(undefined);

function OnboardProvider({ children, ...onboardProps }: OnboardProviderProps) {
  const [address, setAddress] = useState<string | undefined>(undefined)
  const [network, setNetwork] = useState<number | undefined>(undefined)
  const [balance, setBalance] = useState<number | undefined>(undefined)
  const [wallet, setWallet] = useState<Wallet | undefined>(undefined)
  const [onboard, setOnboard] = useState<OnboardApi | undefined>(undefined)
  const [isReady, setIsReady] = useState<boolean>(false);
  const [notify, setNotify] = useState<NotifyApi | undefined>(undefined)

  const infuraId = process.env.REACT_APP_INFURA_ID
  // TODO: Update this for mainnet deployment
  const infuraRpc = `https://${networkName(network)}.infura.io/v3/${infuraId}`

  useEffect(() => {
    const initializeOnboard = async () => {
      try {
        const montserrat = new FontFaceObserver('Montserrat')
        await montserrat.load(undefined);

        const onboard = Onboard({
          dappId: onboardProps.dappId,
          networkId: onboardProps.networkId,
          darkMode: true,
          walletSelect: {
            wallets: [
              { walletName: 'metamask', preferred: true },
              {
                walletName: 'imToken',
                rpcUrl: 'https://eth-testnet.tokenlon.im', //TODO update this for mainnet mainnet-eth.token.im
                preferred: true,
              },
              { walletName: "coinbase", preferred: true },
              {
                walletName: "portis",
                apiKey: process.env.REACT_APP_PORTIS_API_KEY,
              },
              { walletName: "dapper" },
              {
                walletName: "walletConnect",
                infuraKey: infuraId
              },
              { walletName: "walletLink", rpcUrl: infuraRpc },
              { walletName: "opera" },
              { walletName: "operaTouch" },
              { walletName: "torus" },
              { walletName: "status" },
              { walletName: "unilogin" },
              { walletName: "authereum"},
              {
                walletName: 'ledger',
                rpcUrl: infuraRpc
              },
            ]
          },
          walletCheck: [
            { checkName: 'connect' },
            { checkName: 'accounts' },
            { checkName: 'network' },
            { checkName: 'balance', minimumBalance: '0' }
          ],
          subscriptions: {
            address: setAddress,
            network: setNetwork,
            balance: (balance: string) => {
              (balance)
                ? setBalance(Number(fromWei(balance, 'ether')))
                : setBalance(0);
            },
            wallet: (wallet: Wallet) => {
              if (wallet.provider) {
                wallet.name && localStorage.setItem('honeylemon.selectedWallet', wallet.name)
                setWallet(wallet)
              } else {
                setWallet(undefined)
              }
            }
          }
        })

        const savedWallet = localStorage.getItem('honeylemon.selectedWallet');
        savedWallet && onboard.walletSelect(savedWallet);

        setOnboard(onboard);

        setNotify(Notify({
          dappId: onboardProps.dappId,
          networkId: onboardProps.networkId,
          darkMode: true,
        }));
      } catch (error) {
        console.log('Error initializing onboard');
        console.log(error);
      }
    }
    initializeOnboard();
  }, [onboardProps.dappId, onboardProps.networkId])

  const checkIsReady = async () => {
    const isReady = await onboard?.walletCheck();
    setIsReady(!!isReady);
    return !!isReady;
  }

  const resetOnboard = () => {
    localStorage.clear();
    setIsReady(false);
    onboard?.walletReset();
  }

  return (
    <OnboardContext.Provider value={{
      address: address,
      network: network,
      balance: balance,
      wallet: wallet,
      onboard: onboard,
      notify: notify,
      isReady: isReady,
      checkIsReady,
      resetOnboard,
    }}>
      {children}
    </OnboardContext.Provider>
  )
}

function useOnboard() {
  const context = React.useContext(OnboardContext)
  if (context === undefined) {
    throw new Error('useOnboard must be used within a OnboardProvider')
  }
  return context
}

export { OnboardProvider, useOnboard }