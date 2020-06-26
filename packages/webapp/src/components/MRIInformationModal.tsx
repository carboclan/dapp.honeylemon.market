import React from 'react';
import { Dialog, DialogTitle, DialogContent, Typography, Link } from '@material-ui/core';
import { OpenInNew } from '@material-ui/icons';


interface MRIInformationModalProps {
  open: boolean,
  onClose(): void,
};

const MRIInformationModal: React.SFC<MRIInformationModalProps> = ({ open, onClose }: MRIInformationModalProps) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="dialog-title" maxWidth='sm' fullWidth>
      <DialogTitle id="dialog-title">BTC Mining Revenue Index (MRI_BTC_d)</DialogTitle>
      <DialogContent>
        <Typography variant='caption'>
        The d-day BTC Mining Revenue Index (MRI_BTC_d) represents the network daily average block rewards plus
        fees earned in BTC per 1 terahash (TH) of hash power in the past d days, that is, the total reward over 
        the past d days divided by d.
        </Typography>
        <br />
        <br />
        <img src="HistoricMRIGraph.jpg" style={{ width: '100%' }} alt='Historic MRI'/>
        <br />
        <br />
        <Typography variant='subtitle1'>Design Considerations</Typography>
        <Typography variant='caption'>
        • The index MUST have a clear physical meaning.<br />
        • The index SHOULD closely replicate miners’ revenue in reality.<br /> 
        • The index SHOULD make the contract easy for miners to trade in order to hedge the risk <br /> 
          exposure of mining practice over some certain period of time.
        • The index SHOULD be consistent with the mining industry conventional practices. MRI follows 
          the mining industry convention of Full Pay-Per-Share (FPPS) approach.
        </Typography>
        <br />
        <br />
        <Link href='#' target="_blank" rel='noopener' underline='always'>For mathematical definition of MRI_BTC see the docs.<OpenInNew fontSize='small'/></Link>
      </DialogContent>
    </Dialog>
  )
}

export default MRIInformationModal;
