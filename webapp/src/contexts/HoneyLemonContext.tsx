import * as React from "react";
import { useState, useEffect } from "react";
import { useOnboard } from "./OnboardContext";
import Web3 from "web3";
import {
  HoneyLemonService,
  MinterBridgeAbi,
  MarketContractProxyAbi,
  CollateralTokenAbi,
  PaymentTokenAbi,
  MarketCollateralPoolAbi,
  MarketContractMPXAbi
} from "honeylemon";

const truffleContract = require("@truffle/contract");

const MinterBridge = truffleContract(MinterBridgeAbi);
const MarketContractProxy = truffleContract(MarketContractProxyAbi);
const CollateralToken = truffleContract(CollateralTokenAbi);
const PaymentToken = truffleContract(PaymentTokenAbi);
const MarketCollateralPool = truffleContract(MarketCollateralPoolAbi);
const MarketContractMPX = truffleContract(MarketContractMPXAbi);

export type HoneyLemonContext = {
  honeyLemonService: any; //TODO update this when types exist
};

export type HoneyLemonProviderProps = {
  children: React.ReactNode;
};

const HoneyLemonContext = React.createContext<HoneyLemonContext | undefined>(undefined);

function HoneyLemonProvider({ children }: HoneyLemonProviderProps) {
  const [honeyLemonService, setHoneyLemonService] = useState<any | undefined>(undefined);
  const { wallet, network, isReady } = useOnboard();
  useEffect(() => {
    if (isReady && wallet && network) {
      const web3 = new Web3(wallet.provider);

      const initHoneylemonInstances = async () => {
        MarketContractProxy.setProvider(wallet.provider);
        MinterBridge.setProvider(wallet.provider);
        CollateralToken.setProvider(wallet.provider);
        PaymentToken.setProvider(wallet.provider);
        const minterBridge = await MinterBridge.deployed();
        const marketContractProxy = await MarketContractProxy.deployed();
        const collateralToken = await CollateralToken.deployed();
        const paymentToken = await PaymentToken.deployed();

        const honeyLemonService = new HoneyLemonService(
          process.env.REACT_APP_SRA_URL,
          minterBridge.address,
          marketContractProxy.address,
          collateralToken.address,
          paymentToken.address,
          web3,
          network,
          MarketContractProxy.abi,
          MarketCollateralPool.abi,
          MarketContractMPX.abi
        );
        // setHoneyLemonService(honeyLemonService);
      };
      initHoneylemonInstances();
    }
  }, [wallet, network, isReady, honeyLemonService]);

  return (
    <HoneyLemonContext.Provider
      value={{
        honeyLemonService
      }}
    >
      {children}
    </HoneyLemonContext.Provider>
  );
}

function useHoneyLemon() {
  const context = React.useContext(HoneyLemonContext);
  if (context === undefined) {
    throw new Error("useHoneyLemon must be used within a HoneyLemonProvider");
  }
  return context;
}

export { HoneyLemonProvider, useHoneyLemon };
