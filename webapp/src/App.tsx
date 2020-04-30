import React from 'react';
import theme from './theme';
import { MuiThemeProvider, CssBaseline, Container } from '@material-ui/core';
import {Router} from 'react-router-dom';
import ScrollToTop from './scrollToTop';
import history from './history';
import './App.css';

import HoneyLemonApp from './components/HoneyLemonApp';

function App() {
  return (
    <MuiThemeProvider theme={theme}>
      <Router history={history}>
        <ScrollToTop>
          <CssBaseline />
          <Container maxWidth="sm">
            <HoneyLemonApp />
          </Container>
        </ScrollToTop>
      </Router>
    </MuiThemeProvider>
  );
}

export default App;
