import React from 'react';
import AppWrapper from './AppWrapper';
import { Switch, Route, Redirect } from 'react-router-dom';

const NotFoundRedirect = () => <Redirect to='/404' />

const HoneyLemonApp: React.SFC = () => (
  <AppWrapper>
    <Switch>      
      <Route exact path='/404'>Not Found</Route>
      <Route exact path='/403'>You are not authorized to view this page</Route>
      <Route exact path='/'>Home Page here</Route>
      <Route component={NotFoundRedirect} />
    </Switch>
  </AppWrapper>
)

export default HoneyLemonApp;
