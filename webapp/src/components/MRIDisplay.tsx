import React, { useState } from 'react';
import { Link, Typography, makeStyles, Paper } from '@material-ui/core';
import { Help } from '@material-ui/icons';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import MRIInformationModal from './MRIInformationModal';

const useStyles = makeStyles(({ spacing }) => ({
  mriInfo: {
    textAlign: 'center',
    padding: spacing(2),
  },
}))

const MRIDisplay: React.SFC = () => {
  const { 
    marketData: { currentBTCSpotPrice, currentMRI },
    COLLATERAL_TOKEN_DECIMALS, 
    PAYMENT_TOKEN_DECIMALS 
  } = useHoneylemon();
  const [showMRIInformationModal, setShowMRIInformationModal] = useState(false);
  const classes = useStyles();

  return (
    <>
      <Paper className={classes.mriInfo}>
        <Link
          variant='body1'
          href='#' underline='always'
          onClick={() => setShowMRIInformationModal(true)}>
          Bitcoin Mining Revenue Index (MRI)
          <Help fontSize='small' />
        </Link>
        {currentMRI > 0 ?
          <>
            <Typography align='center' color='secondary'>{`BTC ${currentMRI.toLocaleString(undefined, { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS })}/TH/Day`}</Typography>
            <Typography align='center' color='secondary'>{`(~$${(currentMRI * currentBTCSpotPrice).toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}/TH/Day)`}</Typography>
          </> :
          <Typography>Loading...</Typography>
        }
      </Paper>
      <MRIInformationModal open={showMRIInformationModal} onClose={() => setShowMRIInformationModal(false)} />
    </>
  )
}

export default MRIDisplay;
