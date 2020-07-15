import React from 'react';
import { Typography, Dialog, DialogTitle, DialogContent, Link } from '@material-ui/core';
import { OpenInNew } from '@material-ui/icons';
import { useHoneylemon } from '../contexts/HoneylemonContext';

interface ContractSpecificationModalProps {
  open: boolean,
  onClose(): void,
};

const ContractSpecificationModal: React.SFC<ContractSpecificationModalProps> =
  ({ open, onClose }: ContractSpecificationModalProps) => {
    const {COLLATERAL_TOKEN_NAME, PAYMENT_TOKEN_NAME} = useHoneylemon();
    return (
      <Dialog open={open} onClose={onClose} aria-labelledby="dialog-title" maxWidth='sm' fullWidth>
        <DialogTitle id="dialog-title">Contract Specification</DialogTitle>
        <DialogContent>
          <Typography variant='h6'>Description</Typography>
          <Typography variant='body2' paragraph>
            A BTC Mining Revenue Contract represents the amount of Bitcoin earned with 1 terahash (TH)
            of hashpower per day for 28 days.
          </Typography>

          <Typography variant='h6'>Trading Currency</Typography>
          <Typography variant='body2' paragraph>
            BTC Mining Revenue Contracts are bought and sold in {PAYMENT_TOKEN_NAME}.
          </Typography>

          <Typography variant='h6'>Settlement Currency</Typography>
          <Typography variant='body2' paragraph>
            The BTC Mining Revenue Index (MRI_BTC) is denominated in BTC. The contract is collateralized
            and settled in {COLLATERAL_TOKEN_NAME}. The BTC/{COLLATERAL_TOKEN_NAME} precision is 1 satoshi or 1e-8.
          </Typography>

          <Typography variant='h6'>Tick Size</Typography>
          <Typography variant='body2' paragraph>1e-6 {PAYMENT_TOKEN_NAME} is the minimum price movement.</Typography>

          <Typography variant='h6'>Contract Size</Typography>
          <Typography variant='body2' paragraph>1 TH (per day for 28 days) is the minimum increment of contract size.</Typography>

          <Typography variant='h6'>Cap Price</Typography>
          <Typography variant='body2' paragraph>
            125% of the last updated MRI_BTC when a contract offer is taken, denominated in {COLLATERAL_TOKEN_NAME}. <br />
          Cap price determines the collateral requirement for issuance of short positions, and caps
          the maximum settlement value for long positions.
          </Typography>

          <Typography variant='h6'>Collateral Requirement</Typography>
          <Typography variant='body2' paragraph>
            Long position collateral: a buyer pays {PAYMENT_TOKEN_NAME} upfront without the need for actual collateral. <br />
            The upfront cost in {PAYMENT_TOKEN_NAME} = entry price * quantity.<br /><br />

            Short position collateral: a seller is required to set aside a certain amount of {COLLATERAL_TOKEN_NAME}
            as collateral in the smart contract until the position is closed or when the MRI_BTC
            contract is settled.<br />
            The collateral required in {COLLATERAL_TOKEN_NAME} = cap price * quantity.<br /><br />

            There is NO margin call or forced liquidation.
          </Typography>

          <Typography variant='h6'>Contract Start</Typography>
          <Typography variant='body2' paragraph>
            The timestamp the contract starts to trade (i.e. UTC 00:01 of the contract issue date)
          </Typography>

          <Typography variant='h6'>Contract Expiration</Typography>
          <Typography variant='body2' paragraph>
            The timestamp the contract stops trading (i.e. UTC 00:01 of the expiration date)
          </Typography>

          <Typography variant='h6'>Settlement Value</Typography>
          <Typography variant='body2' paragraph>
            Long settlement value = MAX(MRI_BTC_28 at contract expiration, cap price) * 28 days.<br />
            Short settlement value = (cap price - MRI_BTC_28 at contract expiration) * 28 days.<br />
            The earlier time of the two:<br />
            • 24-hours after contract expiration;<br />
            • The unlikely event of a cap price breach before expiration.<br />
          </Typography>

          <Typography variant='h6'>Settlement Time</Typography>
          <Typography variant='body2' paragraph>24 hours after contract expiration.</Typography>

          <Typography variant='h6'>Arbitration</Typography>
          <Typography variant='body2' paragraph>
            The process of updating settlement value in event of settlement value in dispute.
          </Typography>

          <Typography variant='h6'>Withdrawal Period</Typography>
          <Typography variant='body2' paragraph>
            Buyers and sellers may withdraw their settlement value after settlement.
          </Typography>

          <Typography variant='h6'>Token Naming Method</Typography>
          <Typography variant='body2' paragraph>
            Long/short positions are represented as ERC20 tokens, named in the following format: <br />
            index name-token symbol-forward length-start date-direction.  <br /> <br />

            For example, the long and short position tokens of a 28-Day BTC Mining Revenue Contract 
            starting on June 1, 2020 and expiring on June 28, 2020 are, respectively named  <br />
            MRI-BTC-28D-20200601-Long <br />
            MRI-BTC-28D-20200601-Short <br /> <br />

            Long and short position tokens are fungible within the same MRI_BTC contract. <br />
            Each position token represents 1TH/Day of hashpower till contract expiration. <br />
          </Typography>

          <Typography variant='h6'>Protocols</Typography>
          <Typography variant='body2' paragraph>Market Protocol + 0x Protocol</Typography>
          <br /><br />
          <Link href='https://docs.honeylemon.market/btc-mining-revenue-contract-1#contract-specifications' target="_blank" rel='noopener' underline='always'>For more details, please refer to Honeylemon Documentation.<OpenInNew fontSize='small'/></Link>
        </DialogContent>
      </Dialog>
    )
  }

export default ContractSpecificationModal;
