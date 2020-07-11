import React, { useState } from 'react';
import { Link, Typography, makeStyles, Paper } from '@material-ui/core';
import { Info } from '@material-ui/icons';
import { useHoneylemon } from '../contexts/HoneylemonContext';
import MRIInformationModal from './MRIInformationModal';

const useStyles = makeStyles(({ spacing, palette }) => ({
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
          variant='body2'
          href='#' 
          onClick={() => setShowMRIInformationModal(true)}>
          <b>BTC Mining Revenue Index (MRI_BTC)</b>
          <Info fontSize='small' />
        </Link>
        <Typography variant='body2'>
          Network Daily Average Mining Revenue
        </Typography>
        {currentMRI > 0 ?
          <>
            <Typography align='center' variant='body2'>{`BTC ${currentMRI.toLocaleString(undefined, { maximumFractionDigits: COLLATERAL_TOKEN_DECIMALS })}/TH/Day`}</Typography>
            <Typography align='center' variant='body2'>{`(~$${(currentMRI * currentBTCSpotPrice).toLocaleString(undefined, { maximumFractionDigits: PAYMENT_TOKEN_DECIMALS })}/TH/Day)`}</Typography>
          </> :
          <Typography variant='body2'>Loading...</Typography>
        }
      </Paper>
      <MRIInformationModal open={showMRIInformationModal} onClose={() => setShowMRIInformationModal(false)} />
    </>
  )
}

export default MRIDisplay;
