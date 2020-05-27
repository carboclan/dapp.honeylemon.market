import * as React from "react";
import Web3 from 'web3'
import { useState, useEffect } from "react";
import { MetamaskSubprovider, Web3JsProvider, SignerSubprovider } from '@0x/subproviders';
import { HoneylemonService } from "honeylemon";
import { useOnboard } from "./OnboardContext";

export type HoneylemonContext = {
  honeylemonService: any; //TODO update this when types exist
  collateralTokenBalance: number,
  collateralTokenAllowance: number,
  COLLATERAL_TOKEN_DECIMALS: number,
  paymentTokenBalance: number,
  paymentTokenAllowance: number,
  PAYMENT_TOKEN_DECIMALS: number,
  CONTRACT_DURATION: number,
  isDsProxyDeployed: Boolean,
};

export type HoneylemonProviderProps = {
  children: React.ReactNode;
};

const HoneylemonContext = React.createContext<HoneylemonContext | undefined>(undefined);

const HoneylemonProvider = ({ children }: HoneylemonProviderProps) => {
  const { wallet, network, isReady, address } = useOnboard();
  const [honeylemonService, setHoneylemonService] = useState<any | undefined>(undefined);
  const [collateralTokenBalance, setCollateralTokenBalance] = useState<number>(0);
  const [collateralTokenAllowance, setCollateralTokenAllowance] = useState<number>(0);
  const [paymentTokenBalance, setPaymentTokenBalance] = useState<number>(0);
  const [paymentTokenAllowance, setPaymentTokenAllowance] = useState<number>(0);
  const [isDsProxyDeployed, setIsDsProxyDeployed] = useState<Boolean>(false);
  
  useEffect(() => {
    if (isReady && wallet && network) {
      const initHoneylemonService = async () => {
        let wrappedSubprovider;
        const web3 = new Web3(wallet.provider)
        switch (wallet.name) {
          case 'MetaMask':
            wrappedSubprovider = new MetamaskSubprovider(web3.currentProvider as Web3JsProvider);
            break;
          default:
            wrappedSubprovider = new MetamaskSubprovider(web3.currentProvider as Web3JsProvider);
        }

        const honeylemonService = new HoneylemonService(
          process.env.REACT_APP_SRA_URL,
          process.env.REACT_APP_SUBGRAPH_URL,
          wrappedSubprovider,
          network,
          process.env.REACT_APP_MINTER_BRIDGE_ADDRESS,
          process.env.REACT_APP_MARKET_CONTRACT_PROXY_ADDRESS,
          process.env.REACT_APP_COLLATERAL_TOKEN_ADDRESS,
          process.env.REACT_APP_PAYMENT_TOKEN_ADDRESS,
        );
        setHoneylemonService(honeylemonService);
      };
      initHoneylemonService();
    }
  }, [wallet, network, isReady, address]);



  useEffect(() => {
    const checkBalances = async () => {
      const collateral = await honeylemonService.getCollateralTokenAmounts(address);
      setCollateralTokenAllowance(Number(collateral.allowance.shiftedBy(-8).toString()));
      setCollateralTokenBalance(Number(collateral.balance.shiftedBy(-8).toString()));
      const payment = await honeylemonService.getPaymentTokenAmounts(address);
      setPaymentTokenAllowance(Number(payment.allowance.shiftedBy(-6).toString()));
      setPaymentTokenBalance(Number(payment.balance.shiftedBy(-6).toString()));
      if (!isDsProxyDeployed) {
        const proxyDeployed = await honeylemonService.addressHasDSProxy(address)
        setIsDsProxyDeployed(proxyDeployed);
      }
    }
    let poller: NodeJS.Timeout;
    if (honeylemonService) {
      checkBalances();
      poller = setInterval(checkBalances, 5000);
    }

    return () => {
      console.log(`destroying balance poller for ${address}`);
      clearInterval(poller);
    }
  }, [honeylemonService, address])

  return (
    <HoneylemonContext.Provider
      value={{
        honeylemonService,
        collateralTokenBalance,
        collateralTokenAllowance,
        COLLATERAL_TOKEN_DECIMALS: 8, //TODO: Extract this from library when TS conversion is done
        paymentTokenAllowance,
        paymentTokenBalance,
        PAYMENT_TOKEN_DECIMALS: 6, //TODO: Extract this from library when TS conversion is done
        CONTRACT_DURATION: 2,
        isDsProxyDeployed, //TODO: Extract this from library when TS conversion is done
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
