import React from 'react';
import { Button, Typography, Grid, makeStyles } from '@material-ui/core';
import { InputNumber } from 'antd';

const useStyles = makeStyles(() => ({
  rightAlign: {
    textAlign: 'end',
  }
}))

const BuyContractPage: React.SFC = () => {
  // const { wallet, onboard, address, network, balance, notify } = useOnboard();
  const classes = useStyles();
  return (
    <Grid container alignItems='stretch' justify='center'>
      <Grid item xs={12}>
        <Typography variant='h6'>Buy Mining Rewards</Typography>
      </Grid>
      <Grid item xs={6}><Typography>PRICE</Typography></Grid>
      <Grid item xs={6} className={classes.rightAlign}><Typography>$0.115 Th/day</Typography></Grid>
      <Grid item xs={6}><Typography>ENTER BUDGET</Typography></Grid>
      <Grid item xs={6} className={classes.rightAlign}>
        <InputNumber
          min={0}
          onChange={value => console.log(value)}
          size='small'
        />
      </Grid>
      <Typography variant='h6'>31.06 Th for 28 days</Typography>
      <hr />
      <Button color="primary">BUY NOW</Button>
      <Typography variant='h6'>
        You will pay $100 buy 31.05 Th of hasrate for 28 days for $0.115 Th/day.
        You will receive the average value of the Mining Revenue Index over 28 days.
        Representing 883.2 Th of mining power per day per contract.
      </Typography>
      <Typography variant='h6'>See full contract specification here.</Typography>
    </Grid>
  )
}

export default BuyContractPage;
