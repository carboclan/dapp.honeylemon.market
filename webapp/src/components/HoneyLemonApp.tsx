import React from 'react';
import AppWrapper from './AppWrapper';
import { Switch, Route, Redirect } from 'react-router-dom';
import { OnboardProvider } from './OnboardContext';
import { HoneyLemonProvider } from './HoneyLemonContext'
import LandingPage from './LandingPage';

const NotFoundRedirect = () => <Redirect to='/404' />

const HoneyLemonApp: React.SFC = () => {
  const onboardInit = {
    dappId: process.env.REACT_APP_BLOCKNATIVE_API_KEY || '',
    networkId: Number.parseInt(process.env.REACT_APP_NETWORK_ID || '1'),
  }
  debugger
  return (
    //@ts-ignore
    <OnboardProvider {...onboardInit}>
      <HoneyLemonProvider>
        <AppWrapper>
          <Switch>
            <Route exact path='/404'>Not Found</Route>
            <Route exact path='/403'>You are not authorized to view this page</Route>
            <Route exact path='/' component={LandingPage} />
            <Route component={NotFoundRedirect} />
          </Switch>
        </AppWrapper >
      </HoneyLemonProvider>
    </OnboardProvider >
  )
}

export default HoneyLemonApp;
