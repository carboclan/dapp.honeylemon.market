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
          •  The BTC Mining Revenue Index (<i>MRI_BTC_d</i>) represents the Bitcoin network daily average block rewards plus fees (in BTC) per 1 terahash (TH) of hash power in the past d days.<br/>
          •  For example, <i>MRI_BTC_1</i> represents “1-day BTC Mining Revenue Index” (abbreviated as MRI_BTC). <i>MRI_BTC_28</i> represents the “28-day BTC Mining Revenue Index”.<br/>
          •  <i>MRI_BTC_d</i> follows the mining industry convention of Full Pay-Per-Share (FPPS) approach.<br/>
        </Typography>
        <br />
        <br />
        <img src="HistoricMRIGraph.jpg" style={{ width: '100%' }} alt='Historic MRI' />
        <br />
        <br />
        <Link href='https://docs.honeylemon.market/btc-mining-revenue-contract-1#index' target="_blank" rel='noopener' underline='always'>For mathematical definition of MRI_BTC see the docs.<OpenInNew fontSize='small' /></Link>
      </DialogContent>
    </Dialog>
  )
}

export default MRIInformationModal;
