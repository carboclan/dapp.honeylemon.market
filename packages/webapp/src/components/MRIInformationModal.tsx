import React from 'react';
import { makeStyles, Dialog, DialogTitle, DialogContent, Typography } from '@material-ui/core';

const useStyles = makeStyles(({ palette }) => ({
  mriFormula: {
    // filter: 'invert(1)',
    width: '100%'
  }
}))

interface MRIInformationModalProps {
  open: boolean,
  onClose(): void,
};

const MRIInformationModal: React.SFC<MRIInformationModalProps> = ({ open, onClose }: MRIInformationModalProps) => {
  const classes = useStyles();

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="dialog-title" maxWidth='sm' fullWidth>
      <DialogTitle id="dialog-title">BTC Mining Revenue Index (MRI_BTC_d)</DialogTitle>
      <DialogContent>
        <Typography variant='subtitle1'>Meaning</Typography>
        <Typography variant='caption'>
          The d-day BTC Mining Revenue Index (MRI_BTC_d) represents the network daily average block rewards plus
          fees earned in BTC per 1 terahash (TH) of hash power in the past d days.
        </Typography>
        <br />
        <img src="HistoricMRIGraph.jpg" style={{ width: '100%' }} />
        <br />
        <Typography variant='subtitle1'>Design Considerations</Typography>
        <Typography variant='caption'>
          • The index MUST has a clear physical meaning. <br />
          • The index SHOULD closely replicate a miner's payoff in reality. <br />
          • The index SHOULD make the contract easy for miners (hedgers) to trade. Thus, the miner is able to
            hedge the risk exposure of mining practice of over some certain period of time by entering into a position of such contract.<br />
          • The index SHOULD be consistent with mining industry conventional practices. MRI follows mining industry convention of Full Pay-Per-Share (FPPS) approach.
        </Typography>
        <br />
        <br />
        <Typography variant='subtitle1'>Formula</Typography>
        <img src='BMRIFormula.png' alt='BMRI Formula' className={classes.mriFormula} />
        <Typography variant='caption' paragraph>
          where
        </Typography>
        <Typography variant='caption' paragraph>
        • <strong>MRI_BTC_d</strong> represents the "d-day BTC Mining Revenue Index". For example, MRI_BTC_28
          represents 28-day BTC Mining Revenue Index. We will publish the 1-day Mining Revenue
          Index MRI_BTC_1 at UTC 00:01 each day, and abbreviate it as MRI_BTC.
        </Typography>
        <Typography variant='caption' paragraph>
        • <strong>avgHashrate_d</strong> is the average hashrate starting from block height i over d days
        </Typography>
        <Typography variant='caption' paragraph>
        • <strong>i</strong> represents the block height
        </Typography>
        <Typography variant='caption' paragraph>
        • <strong>d</strong> represents the number of days corresponding to Bitcoin Mining Revenue Index (MRI)
        </Typography>
        <Typography variant='caption' paragraph>
        • <strong>N_d</strong> represents the number of blocks produced within d day(s)
        </Typography>
        <Typography variant='caption' paragraph>
        • <strong>Difficulty_i</strong> represents the value of network difficulty at block height i
        </Typography>
        <Typography variant='caption' paragraph>
        • <strong>Coinbase_i</strong> represents the amount of block rewards at block height i
        </Typography>
        <Typography variant='caption' paragraph>
        • <strong>Fee_i</strong> represents the amount of fees at block height i
        </Typography>
      </DialogContent>
    </Dialog>
  )
}

export default MRIInformationModal;
