import React from 'react';
import { makeStyles, Dialog, DialogTitle, DialogContent } from '@material-ui/core';

const useStyles = makeStyles(({ palette }) => ({
  mriFormula: {
    filter: 'invert(1)',
    width: '100%'
  }
}))

interface MRIInformationModalProps {
  open: boolean,
  onClose(): void,
};

const MRIInformationModal: React.SFC<MRIInformationModalProps> = ({open, onClose}: MRIInformationModalProps) => {
  const classes = useStyles();

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="dialog-title" maxWidth='sm' fullWidth>
      <DialogTitle id="dialog-title">BTC Mining Revenue Index</DialogTitle>
      <DialogContent>
        <img src='WhitePaper_BMRIformula_LaTex.png' alt='BMRI Formula' className={classes.mriFormula}/>
      </DialogContent>
    </Dialog>
  )
}

export default MRIInformationModal;
