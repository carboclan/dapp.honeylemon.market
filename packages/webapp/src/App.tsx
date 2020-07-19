import React, { useEffect } from "react";
import theme from "./theme";
import { MuiThemeProvider, CssBaseline } from "@material-ui/core";
import { Router } from "react-router-dom";
import ScrollToTop from "./helpers/scrollToTop";
import history from "./helpers/history";
import { initGA, GAPageView } from "./helpers/gaTracking";
import ReactGA from "react-ga";

import HoneyLemonApp from "./components/HoneyLemonApp";
import { OnboardProvider } from "./contexts/OnboardContext";
import { HoneylemonProvider } from "./contexts/HoneylemonContext";

history.listen(location => {
  ReactGA.set({ page: location.pathname });
  GAPageView(location.pathname);
});

function App() {
  const onboardInit = {
    dappId: process.env.REACT_APP_BLOCKNATIVE_API_KEY || "",
    networkId: Number.parseInt(process.env.REACT_APP_NETWORK_ID || "1")
  };

  useEffect(() => {
    initGA();
    GAPageView(window.location.pathname);
  }, []);

  return (
    <MuiThemeProvider theme={theme}>
      <Router history={history}>
        <ScrollToTop>
          <CssBaseline />
          <OnboardProvider {...onboardInit}>
            <HoneylemonProvider>
              <HoneyLemonApp />
            </HoneylemonProvider>
          </OnboardProvider>
        </ScrollToTop>
      </Router>
    </MuiThemeProvider>
  );
}

export default App;
