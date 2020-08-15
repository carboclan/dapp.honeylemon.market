import React, { useEffect } from "react";
import theme from "./theme";
import { MuiThemeProvider, CssBaseline } from "@material-ui/core";
import { Router } from "react-router-dom";
import { I18nProvider } from "@lingui/react";
import ScrollToTop from "./helpers/scrollToTop";
import history from "./helpers/history";
import { initHotjar } from "./helpers/hotjar";
import config from "./contexts/HoneylemonConfig";
import HoneyLemonApp from "./components/HoneyLemonApp";
import { OnboardProvider } from "./contexts/OnboardContext";
import { HoneylemonProvider } from "./contexts/HoneylemonContext";
import catalogEn from "./locales/en/messages.js";
import { i18n } from "@lingui/core";

const validNetworks = Object.keys(config).map(network => Number(network));

//@ts-ignore
i18n.load("en", catalogEn);
i18n.activate("en");

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
        <I18nProvider i18n={i18n}>
          <ScrollToTop>
            <CssBaseline />
            <OnboardProvider {...onboardInit}>
              <HoneylemonProvider>
                <HoneyLemonApp />
              </HoneylemonProvider>
            </OnboardProvider>
          </ScrollToTop>
        </I18nProvider>
      </Router>
    </MuiThemeProvider>
  );
}

export default App;
