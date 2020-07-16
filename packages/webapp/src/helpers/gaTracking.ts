import ReactGA from "react-ga";

export const initGA = () => {
  ReactGA.initialize(process.env.REACT_APP_GA_TRACKING_ID || `UA-0000000-0`);
}

export const GAPageView = (page: any) => {
  ReactGA.pageview(page);
}

export const GAmodalView = (modal) => {
  ReactGA.modalview(modal);
};