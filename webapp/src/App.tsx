import React from 'react';
import theme from './theme';
import { MuiThemeProvider, CssBaseline, Container } from '@material-ui/core';
import { Router } from 'react-router-dom';
import ScrollToTop from './helpers/scrollToTop';
import history from './helpers/history';
import HoneyLemonApp from './components/HoneyLemonApp';
import { OnboardProvider } from './contexts/OnboardContext';
import { HoneylemonProvider } from './contexts/HoneylemonContext';

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
            <HoneylemonProvider>
              <Container maxWidth="sm">
                <HoneyLemonApp />
              </Container>
            </HoneylemonProvider>
          </OnboardProvider >
        </ScrollToTop>
      </Router>
    </MuiThemeProvider>
  );
}

export default App;
