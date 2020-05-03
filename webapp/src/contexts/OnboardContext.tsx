import * as React from 'react';
import { useState, useEffect } from 'react';
import Onboard from 'bnc-onboard';

import Notify from 'bnc-notify';
import { Initialization, API, Wallet } from 'bnc-onboard/dist/src/interfaces';
import { fromWei } from 'web3-utils';
export type OnboardProviderProps = {
  dappId: string;
  networkId: number;
  children: React.ReactNode;
}

export type OnboardContext = {
  onboard?: API,
  address?: string,
  network?: number,
  balance?: number,
  wallet?: Wallet,
  notify?: any, //TODO update this when types exist
  isReady: boolean,
  checkIsReady(): Promise<boolean>,
}

function initOnboard(init: Initialization) {
  return Onboard({
    dappId: init.dappId,
    networkId: init.networkId,
    apiUrl: init.apiUrl,
    subscriptions: init.subscriptions,
    darkMode: true,
    walletSelect: {
      wallets: [
        //@ts-ignore
        { walletName: 'metamask' },
      ]
    },
    walletCheck: [
      { checkName: 'derivationPath' },
      { checkName: 'connect' },
      { checkName: 'accounts' },
      { checkName: 'network' },
      { checkName: 'balance', minimumBalance: '100000' }
    ]
  })
}

const OnboardContext = React.createContext<OnboardContext | undefined>(undefined);

function OnboardProvider({ children, ...onboardProps }: OnboardProviderProps) {
  const [address, setAddress] = useState<string | undefined>(undefined)
  const [network, setNetwork] = useState<number | undefined>(undefined)
  const [balance, setBalance] = useState<number | undefined>(undefined)
  const [wallet, setWallet] = useState<Wallet | undefined>(undefined)
  const [onboard, setOnboard] = useState<API | undefined>(undefined)
  const [isReady, setIsReady] = useState<boolean>(false);
  const [notify, setNotify] = useState(undefined)

  useEffect(() => {
    //@ts-ignore
    const onboard = initOnboard({
      dappId: onboardProps.dappId,
      networkId: onboardProps.networkId,
      subscriptions: {
        address: setAddress,
        network: setNetwork,
        balance: (balance: string) => {
          setBalance(Number(fromWei(balance, 'ether')));
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

  }, [onboardProps.dappId, onboardProps.networkId])

  const checkIsReady = async () => {
    const isReady = await onboard?.walletCheck();
    setIsReady(!!isReady);
    return !!isReady;
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