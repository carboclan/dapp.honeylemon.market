import * as React from 'react';
import { useState, useEffect } from 'react';
import Onboard from 'bnc-onboard';
import Notify from 'bnc-notify';
import { API as OnboardApi, Wallet } from 'bnc-onboard/dist/src/interfaces';
import { API as NotifyApi } from 'bnc-notify/dist/src/interfaces';
import { fromWei } from 'web3-utils';
import FontFaceObserver from 'fontfaceobserver';
import * as Sentry from '@sentry/react';

import { networkName } from '../helpers/ethereumNetworkUtils';
import config from './HoneylemonConfig';

export type OnboardProviderProps = {
  dappId: string;
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
  isMobile: boolean,
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

  const validNetworks = Object.keys(config).map(network => Number(network))

  const infuraId = process.env.REACT_APP_INFURA_ID
  const infuraRpc = `https://${networkName(network || validNetworks[0])}.infura.io/v3/${infuraId}`

  useEffect(() => {
    const initializeOnboard = async () => {
      try {
        const montserrat = new FontFaceObserver('Montserrat')
        await montserrat.load(undefined);

        const onboard = Onboard({
          dappId: onboardProps.dappId,
          networkId: validNetworks[0],
          darkMode: true,
          walletSelect: {
            wallets: [
              { walletName: 'metamask', preferred: true },
              {
                walletName: 'imToken',
                rpcUrl: ((!!network && network === 1) || (validNetworks[0] === 1)) ? 
                  'https://mainnet-eth.token.im' : 
                  'https://eth-testnet.tokenlon.im',
                preferred: true,
              },
              { walletName: "coinbase", preferred: true },
              {
                walletName: "portis",
                apiKey: process.env.REACT_APP_PORTIS_API_KEY,
              },
              { walletName: "trust", rpcUrl: infuraRpc },
              { walletName: "dapper" },
              {
                walletName: "walletConnect",
                rpc: { [!!network && network || validNetworks[0]]: infuraRpc },
              },
              { walletName: "walletLink", rpcUrl: infuraRpc },
              { walletName: "opera" },
              { walletName: "operaTouch" },
              { walletName: "torus" },
              { walletName: "status" },
              { walletName: "unilogin" },
              { walletName: "authereum" },
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
            network: (network) => {
              if (validNetworks.includes(network)) {
                onboard.config({networkId: network})
              }
              setNetwork(network)
              onboard.walletCheck();
            },
            balance: (balance) => {
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
          networkId: network || validNetworks[0],
          darkMode: true,
        }));
      } catch (error) {
        console.log('Error initializing onboard');
        console.log(error);
        Sentry.captureException(error);
      }
    }
    initializeOnboard();
  }, [onboardProps.dappId])

  const checkIsReady = async () => {
    const isReady = await onboard?.walletCheck();
    setIsReady(!!isReady);
    !!isReady &&
      Sentry.configureScope(function (scope) {
        scope.setUser({ "id": address, "network": networkName(network) });
      });
    return !!isReady;
  }

  const resetOnboard = () => {
    localStorage.clear();
    setIsReady(false);
    onboard?.walletReset();
  }

  const refreshGasPrice = async () => {
    try {
      // const etherchainResponse = await (await fetch('https://www.etherchain.org/api/gasPriceOracle')).json();
      const ethGasStationResponse = await (await fetch(`https://ethgasstation.info/api/ethgasAPI.json?api-key=${process.env.REACT_APP_ETH_GAS_STATION_API_KEY}`)).json()
      const newGasPrice = !isNaN(Number(ethGasStationResponse.fast)) ? Number(ethGasStationResponse.fast) / 10 : 35;
      console.log(`Settings new gas price ${newGasPrice} gwei`);
      setGasPrice(newGasPrice);
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
      console.log('Using 35 gwei as default')
      setGasPrice(35);
    }
  }

  // Gas Price poller
  useEffect(() => {
    if (network || validNetworks[0] === 1) {
      console.log('Starting Gas Price Poller')
      const getGasPrice = refreshGasPrice;

      let poller: NodeJS.Timeout;
      getGasPrice();
      poller = setInterval(getGasPrice, 60000);
      return () => {
        clearInterval(poller);
      }
    } else {
      console.log('You are not using mainnet. Defaulting to 10 gwei')
      setGasPrice(10);      
    }
  }, [])

  const onboardState = onboard?.getState();

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
      isMobile: !!onboardState?.mobileDevice
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