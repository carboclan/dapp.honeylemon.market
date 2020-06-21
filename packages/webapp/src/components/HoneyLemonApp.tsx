import React from 'react';
import AppWrapper from './AppWrapper';
import { Switch, Route, Redirect } from 'react-router-dom';
import HomePage from './HomePage';
import BuyContractPage from './BuyContractPage';
import PortfolioPage from './PortfolioPage';
import OfferContractPage from './OfferContractPage';
import MiningStatsPage from './MiningStatsPage';
import { useOnboard } from '../contexts/OnboardContext';
import { Container, makeStyles } from '@material-ui/core';


const useStyles = makeStyles(({spacing}) => ({
  contentContainer: {
    paddingTop: spacing(9.5),
  }
}))

const ConditionalRoute: React.FC<any> = ({
  component: Component,
  isAuthorized,
  redirectPath = '/403',
  ...rest
}) => (
    <Route
      {...rest}
      render={props => (
        isAuthorized ? (
          <Component {...props} />
        ) : (
            <Redirect
              to={{
                pathname: `${redirectPath}`,
                state: { from: props.location },
              }}
            />
          )
      )
      }
    />
  );

const HoneyLemonApp: React.SFC = () => {
  const { isReady } = useOnboard();
  const classes = useStyles();
  return (
    <AppWrapper>
      <Container maxWidth='sm' className={classes.contentContainer}>
        <Switch>
          <Route exact path='/' component={HomePage} />
          <ConditionalRoute exact path='/buy' component={BuyContractPage} isAuthorized={isReady} redirectPath='/' />
          <ConditionalRoute exact path='/offer' component={OfferContractPage} isAuthorized={isReady} redirectPath='/' />
          <Route exact path='/stats' component={MiningStatsPage} />
          <ConditionalRoute exact path='/portfolio' component={PortfolioPage} isAuthorized={isReady} redirectPath='/' />
          <Route exact path='/404'>Not Found</Route>
          <Route exact path='/403'>You are not authorized to view this page</Route>
          <Route><Redirect to='/404' /></Route>
        </Switch>
      </Container>
    </AppWrapper >
  )
}

export default HoneyLemonApp;
