import * as React from 'react';
import { useState, useEffect } from 'react';
import {HoneyLemonService, MinterBridgeAbi} from 'honeylemon';

export type HoneyLemonContext = {
  honeyLemonService: any, //TODO update this when types exist
}

export type HoneyLemonProviderProps = {
  children: React.ReactNode
}

const HoneyLemonContext = React.createContext<HoneyLemonContext | undefined>(undefined);

function HoneyLemonProvider({ children }: HoneyLemonProviderProps) {
  const [honeyLemonService, setHoneyLemonService] = useState<any | undefined>(undefined)

  useEffect(() => {
    const honeyLemonService = new HoneyLemonService(
      process.env.REACT_APP_SRA_URL,
      MinterBridgeAbi.
    )
    setHoneyLemonService({foo: 'bar'});
  }, [])

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