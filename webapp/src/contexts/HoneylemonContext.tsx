import * as React from "react";
import { useState, useEffect } from "react";
import { useOnboard } from "./OnboardContext";
import Web3 from "web3";
import {
  HoneylemonService,
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

export type HoneylemonContext = {
  honeylemonService: any; //TODO update this when types exist
};

export type HoneylemonProviderProps = {
  children: React.ReactNode;
};

const HoneylemonContext = React.createContext<HoneylemonContext | undefined>(undefined);

function HoneylemonProvider({ children }: HoneylemonProviderProps) {
  const [honeylemonService, setHoneylemonService] = useState<any | undefined>(undefined);
  const { wallet, network, isReady } = useOnboard();
  useEffect(() => {
    if (isReady && wallet && network) {
      const web3 = new Web3(wallet.provider);

      const initHoneylemonService = async () => {
        MarketContractProxy.setProvider(wallet.provider);
        MinterBridge.setProvider(wallet.provider);
        CollateralToken.setProvider(wallet.provider);
        PaymentToken.setProvider(wallet.provider);
        const minterBridge = await MinterBridge.deployed();
        const marketContractProxy = await MarketContractProxy.deployed();
        const collateralToken = await CollateralToken.deployed();
        const paymentToken = await PaymentToken.deployed();

        const honeylemonService = new HoneylemonService(
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
        setHoneylemonService(honeylemonService);
      };
      initHoneylemonService();
    }
  }, [wallet, network, isReady]);

  return (
    <HoneylemonContext.Provider
      value={{
        honeylemonService: honeylemonService
      }}
    >
      {children}
    </HoneylemonContext.Provider>
  );
}

function useHoneylemon() {
  const context = React.useContext(HoneylemonContext);
  if (context === undefined) {
    throw new Error("useHoneylemon must be used within a HoneylemonProvider");
  }
  return context;
}

export { HoneylemonProvider, useHoneylemon };
