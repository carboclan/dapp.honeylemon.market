import * as React from 'react';
import { useState, useEffect } from 'react';
import HoneylemonService from '../../../src/lib/HoneylemonService';

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
    // TODO instantiate api client here
    const honeyLemonService = new HoneylemonService()
    setHoneyLemonService(honeyLemonService);
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
    throw new Error('useOnboard must be used within a OnboardProvider')
  }
  return context
}

export { HoneyLemonProvider, useHoneyLemon }