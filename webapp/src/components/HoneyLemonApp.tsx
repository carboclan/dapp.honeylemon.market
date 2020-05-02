import React from 'react';
import AppWrapper from './AppWrapper';
import { Switch, Route, Redirect } from 'react-router-dom';
import { OnboardProvider } from './OnboardContext';
import { HoneyLemonProvider } from './HoneyLemonContext'
import LandingPage from './LandingPage';
import HomePage from './HomePage';
import BuyContractPage from './BuyContractPage';
import PortfolioPage from './PortfolioPage';
import OfferContractPage from './OfferContractPage';
import MiningStatsPage from './MiningStatsPage';


const HoneyLemonApp: React.SFC = () => {
  const onboardInit = {
    dappId: process.env.REACT_APP_BLOCKNATIVE_API_KEY || '',
    networkId: Number.parseInt(process.env.REACT_APP_NETWORK_ID || '1'),
  }
  return (
    //@ts-ignore
    <OnboardProvider {...onboardInit}>
      <HoneyLemonProvider>
        <AppWrapper>
          <Switch>
            <Route exact path='/' component={LandingPage} />
            <Route exact path='/home' component={HomePage} />
            <Route exact path='/buy' component={BuyContractPage} />
            <Route exact path='/offer' component={OfferContractPage} />
            <Route exact path='/stats' component={MiningStatsPage} />
            <Route exact path='/portfolio' component={PortfolioPage} />
            <Route exact path='/404'>Not Found</Route>
            <Route exact path='/403'>You are not authorized to view this page</Route>
            <Route><Redirect to='/404' /></Route>
          </Switch>
        </AppWrapper >
      </HoneyLemonProvider>
    </OnboardProvider >
  )
}

export default HoneyLemonApp;
