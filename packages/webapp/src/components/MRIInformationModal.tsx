import React from 'react';
import { makeStyles, Dialog, DialogTitle, DialogContent, Typography, Link } from '@material-ui/core';

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
        <Typography variant='caption'>
          The d-day BTC Mining Revenue Index (MRI_BTC_d) represents the network daily average block rewards
          plus fees earned in BTC per 1 terahash (TH) of hash power in the past d days, that is, the total
          reward over the past d days divided by d.
        </Typography>
        <br />
        <br />
        <img src="HistoricMRIGraph.jpg" style={{ width: '100%' }} />
        <br />
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
        <Link href='#' target="_blank" rel='noopener' underline='always'>For mathematical definition of MRI_BTC see the docs</Link>
      </DialogContent>
    </Dialog>
  )
}

export default MRIInformationModal;
