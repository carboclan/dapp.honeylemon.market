import React from 'react';
import { Table, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent } from '@material-ui/core';

interface ContractSpecificationModalProps {
  open: boolean,
  onClose(): void,
};

const ContractSpecificationModal: React.SFC<ContractSpecificationModalProps> =
  ({ open, onClose }: ContractSpecificationModalProps) => {

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
                  Bitcoin earned with 1 terahash of hashpower per day for 28 days.
              </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Trading Currency</TableCell>
                <TableCell>Mining Revenue Contracts are bought and sold in USDT.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Settlement Currency</TableCell>
                <TableCell>
                  The Bitcoin Mining Revenue Index (MRI) is denominated in BTC, the collateral is in imBTC, 
                  long/short position settle in imBTC.
              </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tick Size</TableCell>
                <TableCell>1e-6 USDT, as the minimum price movement</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Contract Size</TableCell>
                <TableCell>1 TH per day for 28 days as the minimum increment of contract size.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Cap Price</TableCell>
                <TableCell>
                  125% of the last updated Bitcoin MRI when contract is offered, denominated in imBTC. Cap price determines the
                  collateral requirement for isssuance of short position, and caps the max win for long position.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Collateral Requirement</TableCell>
                <TableCell>
                  Long position collateral = entry price * quantity, currency denomination: USDT.<br /> <br />
                  Short position collateral = cap price * quantity, currency denomination: imBTC.<br /> <br />
                  Collateral is locked in the smart contract until the position is closed or the contract is settled.
                  There is NO margin call or liquidation.
              </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Contract Start</TableCell>
                <TableCell>
                  The timestamp the contract starts to trade (i.e. UTC 00:01 of the contract issue date).
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Contract Expiration</TableCell>
                <TableCell>
                  The timestamp the contract stops trading (i.e. UTC 00:01 of the expiration date).
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Settlement Value</TableCell>
                <TableCell>
                  The average value of the Bitcoin MRI between contract inception and expiration * 28 days. <br /> <br />
                  Long settlement value = MAX(average value of the Bitcoin MRI between contract inception and expiration, cap price) * 28 days. <br /> <br />
                  Short settlement value = (cap price - average value of the Bitcoin MRI between contract inception and expiration) * 28 days.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Settlement Time</TableCell>
                <TableCell>24 hours after contract expiration.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Arbitration</TableCell>
                <TableCell>
                  The process of updating settlement value in event of settlement value published by 
                  the oracle being incorrect.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Withdrawal Period</TableCell>
                <TableCell>Traders may withdraw their settlement value after settlement time.</TableCell>
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
                <TableCell>Market Protocol + 0x Protocol</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Notes</TableCell>
                <TableCell>
                  A market for a new 28-day contract is deployed each day at UTC 00:01. <br />
                  New contracts are issued (i.e. long/short position token minted) when order is filled. <br />
                  Honeylemon only supports primary issuance of the contract as represented as long/short position tokens. <br />
                  While Honeylemon does not provide interface for secondary market trading, the long/short ERC20 position tokens can be traded OTC (i.e. via Uniswap). <br />
                  Early redemption for collateral prior to settlement is enabled for whitelisted market makers who hold both long/short position token pairs. <br />
                  The settlement timestamp is updated when the settlement value is last updated. <br />
                  Initial settlement value is typically set within minutes of the expiration timestamp but may also be updated in the event of a settlment arbitration. <br />
                  Arbitration, if necessary, happens between contract expiration and settlement.<br /> <br />
                  For more details, please refer to Honeylemon Documentation.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    )
  }

export default ContractSpecificationModal;
