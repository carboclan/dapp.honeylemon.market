import React, { useEffect } from "react";
import theme from "./theme";
import { MuiThemeProvider, CssBaseline } from "@material-ui/core";
import { Router } from "react-router-dom";
import ScrollToTop from "./helpers/scrollToTop";
import history from "./helpers/history";
import { initHotjar } from "./helpers/hotjar";
import config from "./contexts/HoneylemonConfig";
import HoneyLemonApp from "./components/HoneyLemonApp";
import { OnboardProvider } from "./contexts/OnboardContext";
import { HoneylemonProvider } from "./contexts/HoneylemonContext";
import { LanguageSwitcherProvider } from "./contexts/LanguageSwitcherContext";
const validNetworks = Object.keys(config).map(network => Number(network));

function App() {
  const onboardInit = {
    dappId: process.env.REACT_APP_BLOCKNATIVE_API_KEY || "",
    networkId: validNetworks[0]
  };

  useEffect(() => {
    initHotjar();
  }, []);

  return (
    <MuiThemeProvider theme={theme}>
      <Router history={history}>
        <LanguageSwitcherProvider
          availableLanguages={[
            { id: "en", label: "English" },
            { id: "ru", label: "Русский" }
          ]}
        >
          <ScrollToTop>
            <CssBaseline />
            <OnboardProvider {...onboardInit}>
              <HoneylemonProvider>
                <HoneyLemonApp />
              </HoneylemonProvider>
            </OnboardProvider>
          </ScrollToTop>
        </LanguageSwitcherProvider>
      </Router>
    </MuiThemeProvider>
  );
}

export default App;
