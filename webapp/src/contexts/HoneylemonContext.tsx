import * as React from "react";
import { useState, useEffect } from "react";
import { useOnboard } from "./OnboardContext";
import Web3 from "web3";
import { HoneylemonService } from "honeylemon";
import { MetamaskSubprovider } from '@0x/subproviders';

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
      const initHoneylemonService = async () => {
        const honeylemonService = new HoneylemonService(
          process.env.REACT_APP_SRA_URL,
          new MetamaskSubprovider(wallet.provider),
          network
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
