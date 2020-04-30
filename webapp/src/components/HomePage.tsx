import React from 'react';
import { Link, Button, Typography } from '@material-ui/core';
import { forwardTo } from '../history';


const HomePage: React.SFC = () => {
  // const { wallet, onboard, address, network, balance, notify } = useOnboard();
  return (
    <>
      <Typography color="secondary" variant='h3'>Sweet Deals On Cyrpto.</Typography>
      <Link href="#">
        <Typography>
          <span role="img" aria-label="fire">🔥</span>
          Mining Market Live Stats
          <span role="img" aria-label="fire">🔥</span>
        </Typography>
      </Link>
      <Typography variant='h6'>I am a BTC Holder</Typography>
      <Typography color='secondary'>pay cash and earn miner rewards</Typography>
      <Button color="primary" onClick={() => forwardTo('/buy')}>BUY CONTRACTS</Button>
      <hr />
      <Typography variant='h6'>I am a BTC miner</Typography>
      <Typography color='secondary'>hedge risk and get cash up front</Typography>
      <Button color="primary">OFFER CONTRACTS</Button>
    </>
  )
}

export default HomePage;
