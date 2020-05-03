import React from 'react';
import theme from './theme';
import { MuiThemeProvider, CssBaseline, Container } from '@material-ui/core';
import { Router } from 'react-router-dom';
import ScrollToTop from './scrollToTop';
import history from './history';
import 'typeface-montserrat';
import './App.css';

import HoneyLemonApp from './components/HoneyLemonApp';
import { OnboardProvider } from './contexts/OnboardContext';
import { HoneyLemonProvider } from './contexts/HoneyLemonContext';

function App() {
  const onboardInit = {
    dappId: process.env.REACT_APP_BLOCKNATIVE_API_KEY || '',
    networkId: Number.parseInt(process.env.REACT_APP_NETWORK_ID || '1'),
  }
  return (
    <MuiThemeProvider theme={theme}>
      <Router history={history}>
        <ScrollToTop>
          <CssBaseline />
          <OnboardProvider {...onboardInit}>
            <HoneyLemonProvider>
              <Container maxWidth="sm">
                <HoneyLemonApp />
              </Container>
            </HoneyLemonProvider>
          </OnboardProvider >
        </ScrollToTop>
      </Router>
    </MuiThemeProvider>
  );
}

export default App;
