import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import 'typeface-montserrat';
import './App.css';
import * as Sentry from '@sentry/react';

Sentry.init({dsn: "https://9b6507fbe15848f2aea20a9d65d048d3@o418372.ingest.sentry.io/5320855"});

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
