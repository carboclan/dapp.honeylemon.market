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
      <DialogTitle id="dialog-title">BTC Mining Revenue Index</DialogTitle>
      <DialogContent>
        <Typography variant='subtitle1'>Meaning</Typography>
        <Typography variant='caption'>
          The Bitcoin Mining Revenue Index (MRI) Index represents the network daily average block rewards &
          fees earned in BTC per terahash (TH) of hash power.
        </Typography>
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
        <Typography variant='subtitle1'>Formula</Typography>
        <img src='BMRIFormulaFull.png' alt='BMRI Formula' className={classes.mriFormula}/>
      </DialogContent>
    </Dialog>
  )
}

export default MRIInformationModal;
