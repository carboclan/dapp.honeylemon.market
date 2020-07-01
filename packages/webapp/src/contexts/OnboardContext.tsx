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
  ethBalance?: number,
  wallet?: Wallet,
  notify?: NotifyApi,
  isReady: boolean,
  checkIsReady(): Promise<boolean>,
  resetOnboard(): void,
  gasPrice: number,
  refreshGasPrice(): Promise<void>,
}

const OnboardContext = React.createContext<OnboardContext | undefined>(undefined);

function OnboardProvider({ children, ...onboardProps }: OnboardProviderProps) {
  const [address, setAddress] = useState<string | undefined>(undefined)
  const [network, setNetwork] = useState<number | undefined>(undefined)
  const [ethBalance, setEthBalance] = useState<number | undefined>(undefined)
  const [wallet, setWallet] = useState<Wallet | undefined>(undefined)
  const [onboard, setOnboard] = useState<OnboardApi | undefined>(undefined)
  const [isReady, setIsReady] = useState<boolean>(false);
  const [notify, setNotify] = useState<NotifyApi | undefined>(undefined)
  const [gasPrice, setGasPrice] = useState(0);

  const infuraId = process.env.REACT_APP_INFURA_ID
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
                rpcUrl: onboardProps.networkId === 1 ? 'https://mainnet-eth.token.im' : 'https://eth-testnet.tokenlon.im',
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
                ? setEthBalance(Number(fromWei(balance, 'ether')))
                : setEthBalance(0);
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

  const refreshGasPrice = async () => {
    try {
      const response = await (await fetch('https://www.etherchain.org/api/gasPriceOracle')).json();
      const newGasPrice = !isNaN(Number(response.standard)) ? Number(response.standard)/10 : 35;
      setGasPrice(newGasPrice);
    } catch (error) {
      setGasPrice(35);
    }
  }

  // Gas Price poller
  useEffect(() => {
    const getGasPrice = refreshGasPrice;
   
    let poller: NodeJS.Timeout;
    getGasPrice();
    poller = setInterval(getGasPrice, 60000);

    return () => {
      clearInterval(poller);
    }
  }, [])

  return (
    <OnboardContext.Provider value={{
      address: address,
      network: network,
      ethBalance: ethBalance,
      wallet: wallet,
      onboard: onboard,
      notify: notify,
      isReady: isReady,
      checkIsReady,
      resetOnboard,
      gasPrice,
      refreshGasPrice,
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