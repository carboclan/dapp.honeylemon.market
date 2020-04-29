import * as React from 'react';
import { useState, useEffect } from 'react';

export type HoneyLemonContext = {
  honeyLemonClient: any, //TODO update this when types exist
}

export type HoneyLemonProviderProps = {
  children: React.ReactNode
}

const HoneyLemonContext = React.createContext<HoneyLemonContext | undefined>(undefined);

function HoneyLemonProvider({ children }: HoneyLemonProviderProps) {
  const [honeyLemonClient, setHoneyLemonClient] = useState<any | undefined>(undefined)

  useEffect(() => {
    // TODO instantiate api client here
    setHoneyLemonClient('test');
  }, [])

  return (
    <HoneyLemonContext.Provider value={{
      honeyLemonClient
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