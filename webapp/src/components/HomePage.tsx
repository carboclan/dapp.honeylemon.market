import React, { useEffect, useState } from 'react';
import { Link, Button, Typography, makeStyles, Grid, Divider, Paper } from '@material-ui/core';
import { Link as RouterLink } from 'react-router-dom';
import { OpenInNew } from '@material-ui/icons';
import { forwardTo } from '../helpers/history';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { useOnboard } from '../contexts/OnboardContext';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import ConnectWalletButton from './ConnectWalletButton';
import MRIInformationModal from './MRIInformationModal';

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
  mriInfo: {
    textAlign: 'center',
  },
}))

const HomePage: React.SFC = () => {
  const { isReady } = useOnboard();
  const { marketData: { btcDifficultyAdjustmentDate, currentBTCSpotPrice, currentMRI } } = useHoneylemon();
  const [adjustmentInterval, setAdjustmentInterval] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
  })
  const [showMRIInformationModal, setShowMRIInformationModal] = useState(false);

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
    <>
      <Grid container direction='column' spacing={2}>
        <Grid item>
          <Typography color="secondary" variant='h5' align='center'>Sweet Deals In Crypto Mining</Typography>
        </Grid>
        <Grid item>
          <Paper className={classes.mriInfo}>
            <Link 
              variant='body1' 
              href='#' underline='always' 
              onClick={() => setShowMRIInformationModal(true)}>
                Bitcoin Mining Revenue Index (MRI)
                <OpenInNew fontSize='small'/>
            </Link>
            <Typography align='center' color='secondary'>{`BTC ${currentMRI.toLocaleString(undefined, { maximumFractionDigits: 8 })}/TH/Day`}</Typography>
            <Typography align='center' color='secondary'>{`~ $ ${(currentMRI * currentBTCSpotPrice).toLocaleString(undefined, { maximumFractionDigits: 6 })}/TH/Day`}</Typography>
          </Paper>
        </Grid>
        <Grid item>
          <Link component={RouterLink} to='/stats' underline='always'>
            <Typography align='center' style={{ fontWeight: 'bold' }} gutterBottom>
              <span role="img" aria-label="fire">🔥</span>
              Mining Market Live Stats
              <span role="img" aria-label="fire">🔥</span>
              <OpenInNew fontSize="small"/>
            </Typography>
          </Link>
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
            <Typography style={{ fontWeight: 'bold' }}>Estimate: {dayjs(btcDifficultyAdjustmentDate).format('MMM DD, YYYY HH:mm:ss')}</Typography>
          </Grid>
        </Grid>
        <Grid item xs={12} className={classes.connectSpacer}>
          <ConnectWalletButton />
        </Grid>
        {isReady &&
          <>
            <Typography variant='h5' style={{ fontWeight: 'bold' }}>I am a BTC Miner</Typography>
            <Typography color='secondary' style={{ fontWeight: 'bold' }}>Hedge risk & get cash up front</Typography>
            <Button onClick={() => forwardTo('/offer')} className={classes.button}>OFFER CONTRACTS</Button>
            <Divider className={classes.divider} />
            <Typography variant='h5' style={{ fontWeight: 'bold' }}>I am a BTC Hodler</Typography>
            <Typography color='secondary' style={{ fontWeight: 'bold' }} gutterBottom>Pay cash & earn mining rewards</Typography>
            <Button onClick={() => forwardTo('/buy')} className={classes.button}>BUY CONTRACTS</Button>
          </>
        }
      </Grid>
      <MRIInformationModal open={showMRIInformationModal} onClose={() => setShowMRIInformationModal(false)} />
    </>
  )
}

export default HomePage;
