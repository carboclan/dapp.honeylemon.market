import React, { useEffect, useState } from 'react';
import { Link, Button, Typography, makeStyles, Grid, Divider, Paper, CircularProgress } from '@material-ui/core';
import { Link as RouterLink } from 'react-router-dom';
import { forwardTo } from '../helpers/history';
import dayjs, { Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { useOnboard } from '../contexts/OnboardContext';
dayjs.extend(duration);

const useStyles = makeStyles(({ palette, spacing }) => ({
  button: {
    backgroundColor: palette.secondary.main,
    color: palette.common.black,
    paddingTop: spacing(2),
    paddingBottom: spacing(2),
  },
  divider: {
    margin: spacing(2),
  },
  countdownDigit: {
    border: 3,
    borderStyle: 'solid',
    borderColor: palette.secondary.main,
    borderRadius: 4,
    fontSize: 20,
    fontWeight: 'bold',
    padding: spacing(1),
    margin: spacing(0.5),
  },
  countdownSection: {
    textAlign: 'center',
  },
  notification: {
    backgroundColor: palette.secondary.main,
    color: palette.common.black,
    textAlign: 'center',
    marginLeft: -spacing(2),
    marginRight: -spacing(2),
    marginTop: -spacing(2),
    padding: spacing(2),
    '&:hover': {
      backgroundColor: palette.secondary.dark,
    }
  },
  connectSpacer: {
    paddingTop: `${spacing(8)}px !important`,
    textAlign: 'center'
  },
  loadingSpinner: {
    width: 20,
    flexBasis: 'end',
    flexGrow: 0,
    color: palette.secondary.main,
  },
}))

const HomePage: React.SFC = () => {
  const { wallet, onboard, isReady, checkIsReady } = useOnboard();
  const [isConnecting, setIsConnecting] = useState(false);
  const [difficultyAdjustmentDate, setDifficultyAdjustmentDate] = useState<Dayjs | undefined>(undefined);
  const [adjustmentInterval, setAdjustmentInterval] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
  })

  useEffect(() => {
    const getDifficultyAdjustmentDate = async () => {
      try {
        const currentBlockHeight: number = await (await fetch('https://blockchain.info/q/getblockcount')).json()
        const avgBlockTime: number = await (await fetch('https://blockchain.info/q/interval')).json()
        // work out remaining blocks in current epoc (current Block mod 2016) 
        const currentEpochBlocks = currentBlockHeight % 2016;
        const remainingEpochTime = (2016 - currentEpochBlocks) * avgBlockTime;
        const date = dayjs().add(remainingEpochTime, 's');
        setDifficultyAdjustmentDate(date);
      } catch (error) {
        console.log('Error getting next difficulty adjustment date');
      }
    }
    if (!difficultyAdjustmentDate) {
      getDifficultyAdjustmentDate()
    }
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setAdjustmentInterval({
        days: Math.floor(dayjs.duration(dayjs(difficultyAdjustmentDate).diff(dayjs())).asDays()).toString().padStart(2, '0'),
        hours: dayjs.duration(dayjs(difficultyAdjustmentDate).diff(dayjs())).hours().toString().padStart(2, '0'),
        minutes: dayjs.duration(dayjs(difficultyAdjustmentDate).diff(dayjs())).minutes().toString().padStart(2, '0'),
        seconds: dayjs.duration(dayjs(difficultyAdjustmentDate).diff(dayjs())).seconds().toString().padStart(2, '0'),
      })
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [difficultyAdjustmentDate])

  const classes = useStyles();

  const ready = onboard && wallet && isReady;

  const handleSelectWalletAndConnect = async () => {
    setIsConnecting(true);
    await onboard?.walletSelect();
    await checkIsReady();
    setIsConnecting(false);
  }

  const handleConnect = async () => {
    setIsConnecting(true);
    await checkIsReady();
    setIsConnecting(false);
  }

  return (

    <Grid container direction='column' spacing={2}>
      <Grid item>
        <Typography color="secondary" variant='h5' align='center'>Sweet Deals In Crypto Mining</Typography>
      </Grid>
      <Grid item>
        <Link component={RouterLink} to='/stats' underline='always'>
          <Typography align='center' style={{ fontWeight: 'bold' }} gutterBottom>
            <span role="img" aria-label="fire">🔥</span>
              Mining Market Live Stats
              <span role="img" aria-label="fire">🔥</span>
          </Typography>
        </Link>
      </Grid>
      <Grid item container direction='row' className={classes.countdownSection} spacing={2}>
        <Grid item xs={12}>
          <Typography style={{ fontWeight: 'bold' }}>Next Difficulty Adjustment</Typography>
        </Grid>
        <Grid item xs={3}>
          <span className={classes.countdownDigit}>{adjustmentInterval.days.split('')[0]}</span>
          <span className={classes.countdownDigit}>{adjustmentInterval.days.split('')[1]}</span>
        </Grid>
        <Grid item xs={3}>
          <span className={classes.countdownDigit}>{adjustmentInterval.hours.split('')[0]}</span>
          <span className={classes.countdownDigit}>{adjustmentInterval.hours.split('')[1]}</span>
        </Grid>
        <Grid item xs={3}>
          <span className={classes.countdownDigit}>{adjustmentInterval.minutes.split('')[0]}</span>
          <span className={classes.countdownDigit}>{adjustmentInterval.minutes.split('')[1]}</span>
        </Grid>
        <Grid item xs={3}>
          <span className={classes.countdownDigit}>{adjustmentInterval.seconds.split('')[0]}</span>
          <span className={classes.countdownDigit}>{adjustmentInterval.seconds.split('')[1]}</span>
        </Grid>
        <Grid item xs={3}>
          <span>Days</span>
        </Grid>
        <Grid item xs={3}>
          <span>Hours</span>
        </Grid>
        <Grid item xs={3}>
          <span>Mins</span>
        </Grid>
        <Grid item xs={3}>
          <span>Secs</span>
        </Grid>
        <Grid item xs={12}>
          <Typography style={{ fontWeight: 'bold' }}>Estimate: {difficultyAdjustmentDate?.format('MMM DD, YYYY HH:mm:ss')}</Typography>
        </Grid>
      </Grid>
      {onboard && !wallet &&
        <Grid item xs={12} className={classes.connectSpacer}>
          <Button 
            onClick={() => { handleSelectWalletAndConnect() }} 
            className={classes.button} 
            fullWidth
            disabled={isConnecting}>
              Connect wallet &nbsp;
                {isConnecting && <CircularProgress className={classes.loadingSpinner} size={20} />}
          </Button>
        </Grid>
      }
      {onboard && wallet && !isReady &&
        <Grid item xs={12} className={classes.connectSpacer}>
          <Button 
            onClick={() => { handleConnect() }} 
            className={classes.button} 
            fullWidth
            disabled={isConnecting}>
              Connect wallet &nbsp;
                {isConnecting && <CircularProgress className={classes.loadingSpinner} size={20} />}
          </Button>
        </Grid>
      }
      {onboard && wallet && isReady &&
        <>
          <Typography variant='h5' style={{ fontWeight: 'bold' }}>I am a BTC Hodler</Typography>
          <Typography color='secondary' style={{ fontWeight: 'bold' }} gutterBottom>Pay cash & earn mining rewards</Typography>
          <Button onClick={() => forwardTo('/buy')} className={classes.button} disabled={!ready}>BUY CONTRACTS</Button>
          <Divider className={classes.divider} />
          <Typography variant='h5' style={{ fontWeight: 'bold' }}>I am a BTC Miner</Typography>
          <Typography color='secondary' style={{ fontWeight: 'bold' }}>Hedge risk & get cash up front</Typography>
          <Button onClick={() => forwardTo('/offer')} className={classes.button} disabled={!ready}>OFFER CONTRACTS</Button>
        </>
      }
    </Grid>
  )
}

export default HomePage;
