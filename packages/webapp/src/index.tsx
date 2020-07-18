import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import 'typeface-montserrat';
import './App.css';
import * as Sentry from '@sentry/react';

if (
  process.env.NODE_ENV === "production" &&
  process.env.REACT_APP_SENTRY_RELEASE &&
  process.env.REACT_APP_SENTRY_DSN_URL
) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN_URL,
    release: process.env.REACT_APP_SENTRY_RELEASE,
    environment: process.env.REACT_APP_SENTRY_ENV,
  });
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
