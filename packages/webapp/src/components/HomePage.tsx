import React, { useEffect, useState } from 'react';
import { Button, Typography, makeStyles, Grid, Divider } from '@material-ui/core';
import { forwardTo } from '../helpers/history';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { useOnboard } from '../contexts/OnboardContext';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import ConnectWalletButton from './ConnectWalletButton';
import MRIDisplay from './MRIDisplay';

dayjs.extend(duration);

const useStyles = makeStyles(({ palette, spacing }) => ({
  button: {
    paddingTop: spacing(1),
    paddingBottom: spacing(1),
    fontWeight: 'bold'
  },
  divider: {
    margin: spacing(2),
  },
  countdownDigit: {
    border: 3,
    borderStyle: 'solid',
    borderColor: palette.primary.main,
    borderRadius: 4,
    fontSize: 20,
    fontWeight: 'bold',
    padding: spacing(1),
    margin: spacing(0.5),
  },
  countdownSection: {
    textAlign: 'center',
  },
  connectSpacer: {
    paddingTop: `${spacing(8)}px !important`,
    textAlign: 'center'
  },
  loadingSpinner: {
    width: 20,
    flexBasis: 'end',
    flexGrow: 0,
    color: palette.primary.main,
  },
  mriInfo: {
    textAlign: 'center',
  },
  liveStatsButton: {
    borderColor: palette.primary.main,
    borderWidth: 2,
    borderStyle: 'solid',
    color: palette.primary.main,
    backgroundColor: '#303030',
  }
}))

const HomePage: React.SFC = () => {
  const { isReady } = useOnboard();
  const { marketData: { btcDifficultyAdjustmentDate }, isInMaintencanceMode } = useHoneylemon();
  const [adjustmentInterval, setAdjustmentInterval] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setAdjustmentInterval({
        days: Math.floor(dayjs.duration(dayjs(btcDifficultyAdjustmentDate).diff(dayjs())).asDays()).toString().padStart(2, '0'),
        hours: dayjs.duration(dayjs(btcDifficultyAdjustmentDate).diff(dayjs())).hours().toString().padStart(2, '0'),
        minutes: dayjs.duration(dayjs(btcDifficultyAdjustmentDate).diff(dayjs())).minutes().toString().padStart(2, '0'),
        seconds: dayjs.duration(dayjs(btcDifficultyAdjustmentDate).diff(dayjs())).seconds().toString().padStart(2, '0'),
      })
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [btcDifficultyAdjustmentDate])

  const classes = useStyles();

  return (
      <Grid container direction='column' spacing={2}>
        <Grid item>
          <MRIDisplay />
        </Grid>
        <Grid item container direction='row' className={classes.countdownSection} spacing={2} justify='center' alignItems='stretch'>
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
            <Typography style={{ fontWeight: 'bold' }}>Estimate: {dayjs(btcDifficultyAdjustmentDate).format('MMM DD, YYYY HH:mm')} UTC</Typography>
          </Grid>
        </Grid>
        <Grid item xs={12} style={{textAlign: 'center'}}>
          <Button onClick={() => forwardTo('/stats')} className={classes.liveStatsButton} fullWidth>
            <Typography align='center' style={{ fontWeight: 'bold' }}>
              <span role="img" aria-label="fire">🔥</span>
              Mining Market Live Stats
              <span role="img" aria-label="fire">🔥</span>
            </Typography>
          </Button>
        </Grid>
        <Grid item xs={12} className={classes.connectSpacer}>
          <ConnectWalletButton />
        </Grid>
        {isReady &&
          <>
            {isInMaintencanceMode && <Typography variant='caption' color='error' style={{ fontWeight: 'bold' }} paragraph>Honeylemon service is currently in maintenance mode. Please come back and try again later.</Typography>}
            <Typography variant='h5' style={{ fontWeight: 'bold' }}>I am a BTC investor.</Typography>
            <Typography color='primary' style={{ fontWeight: 'bold' }} gutterBottom>Pay Cash & Earn Mining Revenue in BTC</Typography>
            <Button variant='contained' color='primary' onClick={() => forwardTo('/buy')} className={classes.button} disabled={isInMaintencanceMode}>BUY CONTRACTS</Button>
            <Divider className={classes.divider} />
            <Typography variant='h5' style={{ fontWeight: 'bold' }}>I am a BTC miner.</Typography>
            <Typography color='primary' style={{ fontWeight: 'bold' }}>Hedge Mining Risk & Get Cash Upfront</Typography>
            <Button variant='contained' color='primary' onClick={() => forwardTo('/offer')} className={classes.button} disabled={isInMaintencanceMode}>OFFER CONTRACTS</Button>
          </>
        }
      </Grid>
  )
}

export default HomePage;
