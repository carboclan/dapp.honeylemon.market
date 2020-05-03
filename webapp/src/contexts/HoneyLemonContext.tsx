import * as React from 'react';
import { useState, useEffect } from 'react';
import { HoneyLemonService, MinterBridgeAbi } from 'honeylemon';
import { useOnboard } from './OnboardContext';
import Web3 from 'web3'

export type HoneyLemonContext = {
  honeyLemonService: any, //TODO update this when types exist
}

export type HoneyLemonProviderProps = {
  children: React.ReactNode
}

const HoneyLemonContext = React.createContext<HoneyLemonContext | undefined>(undefined);

function HoneyLemonProvider({ children }: HoneyLemonProviderProps) {
  const [honeyLemonService, setHoneyLemonService] = useState<any | undefined>(undefined)
  const { wallet, network, isReady } = useOnboard();
  useEffect(() => {
    if (isReady && wallet && network) {
      const web3 = new Web3(wallet.provider)
      // const honeyLemonService = new HoneyLemonService(
      //   process.env.REACT_APP_SRA_URL,
      //   undefined,//minterBridgeAddress, 
      //   undefined,//marketContractProxyAddress,
      //   undefined,//collateralTokenAddress,
      //   undefined,//paymentTokenAddress,
      //   web3,
      //   network,
      //   undefined,//marketContractProxyAbi,
      //   undefined,//MarketCollateralPoolAbi,
      //   undefined,//marketContractAbi
      // )
      // setHoneyLemonService(honeyLemonService);
    }
  }, [wallet, network, isReady])

  return (
    <HoneyLemonContext.Provider value={{
      honeyLemonService
    }}>
      {children}
    </HoneyLemonContext.Provider>
  )
}

function useHoneyLemon() {
  const context = React.useContext(HoneyLemonContext)
  if (context === undefined) {
    throw new Error('useHoneyLemon must be used within a HoneyLemonProvider')
  }
  return context
}

export { HoneyLemonProvider, useHoneyLemon }