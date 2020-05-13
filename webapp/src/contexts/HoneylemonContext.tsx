import * as React from "react";
import { useState, useEffect } from "react";
import { useOnboard } from "./OnboardContext";
import { HoneylemonService } from "honeylemon";
import { MetamaskSubprovider, Web3JsProvider, SignerSubprovider } from '@0x/subproviders';
import Web3 from 'web3'
import { BigNumber } from "@0x/utils";

export type HoneylemonContext = {
  honeylemonService: any; //TODO update this when types exist
  collateralTokenBalance: BigNumber,
  collateralTokenAllowance: BigNumber,
  paymentTokenBalance: BigNumber,
  paymentTokenAllowance: BigNumber,
};

export type HoneylemonProviderProps = {
  children: React.ReactNode;
};

const HoneylemonContext = React.createContext<HoneylemonContext | undefined>(undefined);

function HoneylemonProvider({ children }: HoneylemonProviderProps) {
  const { wallet, network, isReady, address } = useOnboard();
  const [honeylemonService, setHoneylemonService] = useState<any | undefined>(undefined);
  const [collateralTokenBalance, setCollateralTokenBalance] = useState<BigNumber>(new BigNumber(0));
  const [collateralTokenAllowance, setCollateralTokenAllowance] = useState<BigNumber>(new BigNumber(0));
  const [paymentTokenBalance, setPaymentTokenBalance] = useState<BigNumber>(new BigNumber(0));
  const [paymentTokenAllowance, setPaymentTokenAllowance] = useState<BigNumber>(new BigNumber(0));

  useEffect(() => {
    if (isReady && wallet && network) {
      const initHoneylemonService = async () => {
        let wrappedSubprovider;
        const web3 = new Web3(wallet.provider)
        switch (wallet.name) {
          case 'MetaMask':
            wrappedSubprovider = new MetamaskSubprovider(web3.currentProvider as Web3JsProvider);
            break;
          case 'Portis':
            wrappedSubprovider = new MetamaskSubprovider(web3.currentProvider as Web3JsProvider);
            break;
          case 'imToken':
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
      debugger;
      const collateral = await honeylemonService.getCollateralTokenAmounts(address);
      setCollateralTokenAllowance(collateral.allowance);
      setCollateralTokenBalance(collateral.balance);
      const payment = await honeylemonService.getPaymentTokenAmounts(address);
      setPaymentTokenAllowance(payment.allowance);
      setPaymentTokenBalance(payment.balance);
    }

    if (honeylemonService) {
      console.log('subscribing to erc20 events');
      debugger;
      honeylemonService.collateralToken.subscribe('Approval', {
        tokenOwner: address,
      }, () => {
        console.log('imBTC approval')
        checkBalances();
      });
      honeylemonService.collateralToken.subscribe('Transfer', {}, () => {
        console.log('imBTC tx')
        checkBalances();
      });
      honeylemonService.paymentToken.subscribe('Approval', {
        tokenOwner: address,
      }, () => {
        console.log('usdc approval')
        checkBalances();
      });
      honeylemonService.paymentToken.subscribe('Transfer', {}, () => {
        console.log('usdc tx')
        checkBalances();
      });
    }

    return () => {
      if (honeylemonService) {
        honeylemonService.collateralToken.unsubscribeAll();
        honeylemonService.paymentToken.unsubscribeAll();
      }
    }
  }, [honeylemonService, address])

  return (
    <HoneylemonContext.Provider
      value={{
        honeylemonService,
        collateralTokenBalance,
        collateralTokenAllowance,
        paymentTokenAllowance,
        paymentTokenBalance
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
