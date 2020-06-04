import React from 'react';
import { Typography, makeStyles, Grid, Table, TableHead, TableRow, TableCell, TableBody, DialogProps, Dialog, DialogTitle, DialogContent } from '@material-ui/core';

const useStyles = makeStyles(({ palette }) => ({

}))

interface ContractSpecificationModalProps {
  open: boolean,
  onClose(): void,
};

const ContractSpecificationModal: React.SFC<ContractSpecificationModalProps> = 
  ({open, onClose}: ContractSpecificationModalProps) => {
  const classes = useStyles();

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="dialog-title" maxWidth='sm' fullWidth>
      <DialogTitle id="dialog-title">Contract Specification</DialogTitle>
      <DialogContent>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>
                A Bitcoin mining revenue contract represents the amount of
                Bitcoin earned with 1 terahash of hashpower Per Day for 28 days.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Trading Currency</TableCell>
              <TableCell>Honeylemon contracts are bought and sold in USDT.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Settlement Currency</TableCell>
              <TableCell>
                The Bitcoin MRI is denominated in BTC, the collateral is in 
                imBTC, long/short position settle in imBTC
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Trading Hours</TableCell>
              <TableCell>24h * 7 days</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Tick Size</TableCell>
              <TableCell>1e-6 USDT, as the minimum price movement</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Lot Size</TableCell>
              <TableCell>1 terahash / 28 days, as the minimum increment of order size</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Cap Price</TableCell>
              <TableCell>125% of Bitcoin MRI when contract is issued</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Collateral Requirement</TableCell>
              <TableCell>
                Long position collateral = entry price * quantity <br /> <br />
                Short position collateral = (cap price - entry price) * quantity <br /> <br />
                Collateral is locked in the smart contract until the position is closed or the contract is settled.
                There is NO margin call or liquidation.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Contract Inception</TableCell>
              <TableCell>
                The timestamp the contract starts to trade (i.e. UTC 00:00:00 of the contract issue date)
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Contract Expiration</TableCell>
              <TableCell>
                The timestamp the contract stops trading (i.e. UTC 00:00:00 of the expiration date)
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Settlement Value</TableCell>
              <TableCell>
                The average value of the Bitcoin MRI between contract inception and expiration * 28 days. <br/> <br/>
                Long settlement value = MAX(average value of the Bitcoin MRI between contract inception and expiration, cap price) * 28 days. <br/> <br/>
                Short settlement value = (cap price - average value of the Bitcoin MRI between contract inception and expiration) * 28 days.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Settlement Time</TableCell>
              <TableCell>
                24 hours after contract expiration (after the last settlement value update).
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Withdrawal Period</TableCell>
              <TableCell>
                Traders may withdraw their settlement value after settlement time.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Token Naming Method</TableCell>
              <TableCell>
                Long/short position tokens - index name, token symbol, forward length, start date, direction. <br /> <br />
                Example:<br />
                A Bitcoin MRI 28-day forward that starts on June 1, 2020 and expires on June 28, 2020:<br />
                MRI-BTC-28D-20200601-Long <br />
                MRI-BTC-28D-20200601-Short
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Protocols</TableCell>
              <TableCell>
                Market Protocol + 0x Protocol
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Notes</TableCell>
              <TableCell>
              A market for a new 28-day contract is deployed everyday at UTC 00:00:01. <br />
              Long/short positions are respresented as ERC20 tokens. <br />
              Arbitration, if necessary, happens between contract expiration and settlement. <br />
              Settlement is possible 24 hours after the expiration timestamp. <br />
              The settlement timestamp is updated when the settlement value is last updated. <br />
              This typically happens within minutes of the expiration timestamp but may also be updated in the event of a price arbitration.<br />
              Arbitration, if necessary, happens between contract expiration and settlement.<br />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>

  )
}

export default ContractSpecificationModal;
