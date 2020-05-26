import * as React from "react";
import Web3 from 'web3'
import { useState, useEffect } from "react";
import { MetamaskSubprovider, Web3JsProvider, SignerSubprovider } from '@0x/subproviders';
import { HoneylemonService } from "honeylemon";
import { useOnboard } from "./OnboardContext";

export type HoneylemonContext = {
  honeylemonService: any; //TODO update this when types exist
  collateralTokenBalance: Number,
  collateralTokenAllowance: Number,
  COLLATERAL_TOKEN_DECIMALS: number,
  paymentTokenBalance: Number,
  paymentTokenAllowance: Number,
  PAYMENT_TOKEN_DECIMALS: number,
  CONTRACT_DURATION: number
};

export type HoneylemonProviderProps = {
  children: React.ReactNode;
};

const HoneylemonContext = React.createContext<HoneylemonContext | undefined>(undefined);

const HoneylemonProvider = ({ children }: HoneylemonProviderProps) => {
  const { wallet, network, isReady, address } = useOnboard();
  const [honeylemonService, setHoneylemonService] = useState<any | undefined>(undefined);
  const [collateralTokenBalance, setCollateralTokenBalance] = useState<Number>(0);
  const [collateralTokenAllowance, setCollateralTokenAllowance] = useState<Number>(0);
  const [paymentTokenBalance, setPaymentTokenBalance] = useState<Number>(0);
  const [paymentTokenAllowance, setPaymentTokenAllowance] = useState<Number>(0);

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
            wrappedSubprovider = new SignerSubprovider(web3.currentProvider as Web3JsProvider);
        }

        const honeylemonService = new HoneylemonService(
          process.env.REACT_APP_SRA_URL,
          process.env.REACT_APP_SUBGRAPH_URL,
          wrappedSubprovider,
          network
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
    }
    const poller = () => setInterval(checkBalances, 5000)
    if (honeylemonService) {
      checkBalances();
      poller();
    }

    return () => {
      clearInterval(poller());
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
        CONTRACT_DURATION: 28
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
