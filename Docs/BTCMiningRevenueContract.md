# 28-Day BTC Mining Revenue Contract

## **Introduction**

The Honeylemon Mining Revenue Contract is the first of a series of Mining Revenue Contracts designed to replicate payoff of existing cloud mining.

The Honeylemon 28-Day BTC Mining Revenue Contract is a forward-like product that settles to the market-wide block reward and fees per Terahash over 28 days as published in the BTC Mining Revenue Index \(BTC\_MRI\), with a 125% max revenue cap for the buyer. The buyer pays a fixed price in stable coin \(USDT\) upfront and later receives the mining output in ERC-20 representation of BTC \(imBTC\) upon contract settlement. Honeylemon contracts are built upon Market Protocol and 0x Protocol v3. 

Honeylemon dApp provides a simple mobile-first trading interface and a one-sided orderbook, allowing miners or traders in general to be short both network difficulty and BTC price. This allows miners to receive cash upfront and hedge mining risks, and gives buyers the opportunity to receive mining payoff without the hassle of mining operations.

## **Index**

The d-day BTC Mining Revenue Index \(MRI\_BTC\_d\) represents the network daily average block rewards plus fees earned in BTC per 1 terahash \(TH\) of hash power in the past d days, that is, the total reward over the past d days divided by `d`.

### **Mathematical Definition**

$$
MRI\_BTC\_d=\frac{1}{avgHashrate_d}\times\sum^{i+N_d}_i(Coinbase_i+Fee_i)
$$

$$
avgHashrate_d=Difficulty_i\times\frac{2^{32}}{86400}\times d
$$



* `MRI_BTC_d` represents the "d-day BTC Mining Revenue Index". For example, `MRI_BTC_28` represents the 28-day BTC Mining Revenue Index. We will publish the 1-day Mining Revenue Index `MRI_BTC_1` at UTC 00:01 each day, and abbreviate it as `MRI_BTC`.
* `avgHashrate_d` is the average hashrate starting from block height `i` over `d` days
* `i` represents the block height
* `d` represents the number of days corresponding to Bitcoin Mining Revenue Index \(MRI\)
* `N_d` represents the number of blocks produced within `d` day\(s\)
* `Difficulty_i` represents the value of network difficulty at block height `i`
* `Coinbase_i` represents the amount of block rewards at block height `i`
* `Fee_i` represents the amount of fees at block height `i`

### **Design Considerations**

* The index MUST have a clear physical meaning.
* The index SHOULD closely replicate miners’ revenue in reality. 
* The index SHOULD make the contract easy for miners to trade in order to hedge the risk exposure of mining practice over some certain period of time.
* The index SHOULD be consistent with the mining industry conventional practices. MRI follows the mining industry convention of Full Pay-Per-Share \(FPPS\) approach.


### **Index Oracle**

Honeylemon admin maintains an oracle that posts `BTC_MRI` on-chain. This data is used by the Market Protocol smart contracts to calculate payoffs at settlement. 

Currently the oracle is centralized and operated by Honeylemon admin. The oracle component will be redesigned towards a more trustless approach in the future. The oracle currently provides two indices:

* `MRI_BTC_1`  - used once to calculate collateral requirements upon contract creation when an offer is taken. 
* `MRI_BTC_28` - used to calculate payoffs at contract settlement.

 
## **Contract Specification**

Description | A BTC Mining Revenue Contract represents the amount of Bitcoin earned with 1 terahash (TH) of hashpower per day for 28 days.
:------|:-----
Trading Currency | BTC Mining Revenue Contracts are bought and sold in USDT.
Settlement Currency | The BTC Mining Revenue Index (MRI_BTC) is denominated in BTC. The contract is collateralized and settled in imBTC. The BTC/imBTC precision is 1 satoshi or 1e-8. 
Tick Size | 1e-6 USDT is the minimum price movement.
Contract Size | 1 TH (per day for 28 days) is the minimum increment of contract size.
Cap Price | 125% of the last updated MRI_BTC when a contract offer is taken, denominated in imBTC. Cap price determines the collateral requirement for issuance of short positions, and caps the maximum settlement value for long positions.
Collateral Requirement | Long position collateral: a buyer pays USDT upfront without the need for actual collateral. The upfront cost in USDT = entry price * quantity. Short position collateral: a seller is required to set aside a certain amount of imBTC as collateral in the smart contract until the position is closed or when the MRI_BTC contract is settled. The collateral required in imBTC = cap price * quantity. There is NO margin call or forced liquidation.
Contract Start | The timestamp the contract starts to trade (i.e. UTC 00:01 of the contract issue date).
Contract Expiration | The timestamp the contract stops trading (i.e. UTC 00:01 of the expiration date).
Settlement Value | Long settlement value = MAX(MRI_BTC_28 at contract expiration, cap price) * 28 days. Short settlement value = (cap price - MRI__BTC_28 at contract expiration) * 28 days.
Settlement Time | The earlier time of the two: 24-hours after contract expiration; the unlikely event of a cap price breach before expiration.
Arbitration | The process of updating settlement value in event of settlement value in dispute.
Withdrawal Period | Buyers and sellers may withdraw their settlement value after settlement.
Position Tokens &  Naming Method | Long/short positions are represented as ERC20 tokens, named in the following format: index name-token symbol-forward length-start date-direction. For example, the long and short position tokens of a 28-Day BTC Mining Revenue Contract starting on June 1, 2020 and expiring on June 28, 2020 are, respectively named MRI-BTC-28D-20200601-Long and MRI-BTC-28D-20200601-Short. Long and short position tokens are fungible within the same MRI_BTC contract. Each position token represents 1 TH / Day of hashpower till contract expiration.
Protocols | Market Protocol + 0x Protocol

**Note:** 

* A market for a new 28-day contract is deployed each day at UTC 00:01. 
* New contracts are issued (i.e. long/short positions token minted) when an order is filled. 
* While Honeylemon does not provide an interface for secondary market trading, the long/short ERC20 position tokens can be traded OTC (i.e. via Uniswap). 
* Early redemption for collateral prior to settlement is enabled for market makers who hold both long/short position token pairs.

## **Trading Example**

Here is an example of the life span of a MRI_BTC_28 contract.

Bob places an offer of 1,000 TH of the current day MRI_BTC_28 contract at the price of 0.08 USDT / TH / Day. In order for Bob to place this offer, he needs to allocate a collateral in the amount of his maximum possible pay to his counterparty in imBTC upon contract expiration. 

Assuming the MRI_BTC_1 is 0.00000833 / TH / Day, then in this case the collateral deposit Bob needs is:

0.00000833 / TH / Day * 28 Days * 125% * 1,000 TH =  0.29155 imBTC
 
Alice, on the other hand would like to to buy 1,000 TH of hashpower and finds the price 0.08 USDT/TH/Day acceptable. In order for Alice to buy 1,000 TH of hashpower, she needs to pay: 

0.08 USDT / TH / Day * 28 Days * 1,000 TH = 2,440 USDT

Once Alice confirms her purchase on-chain, the smart contract then matches Bob’s offer with Alice’s purchase. Then an equal number of long and short position tokens are created representing the corresponding positions held by the two parties. 

Bob receives the 2240 USDT immediately upon transaction completion and his 0.29155 imBTC is designated as collateral.

The payoff for Alice is expected to happen upon settlement of the contract 1 day after expiration, or 29 days after today. The payoff will be deducted directly from the 0.29155 imBTC collateral set aside by Bob. 

Since the payoff is capped by the collateral, no forced liquidation would happen during the 28-day lifetime of the contract. 

## **Cap Price**

The cap of 125% is determined based onanalysis of the Bitcoin network hashpower evolvement from Jan 1, 2016 to Jun 1, 2020. The probability of an over 25% increase in BTC hashpower over a 28-day period is close to 0 with statistical significance. 

On the other hand, the mechanism of the MRI_BTC_28 contract would not break even in the case that overall hashpower increases by more than 25%. This is due to the fact that the cap is an open piece of information known by all parties of the market and therefore market prices already reflect the cap in place.

## **Collateral Mechanism**

The long and short side of an MRI_BTC contract is asymmetrical. The buyer pays in full upfront and thus is not required collateral. The seller, on the other hand must set aside 125% of the then current MRI_BTC_1 * 28 (also the max revenue payoff possible) as collateral.  


## **Position Tokens**
Position Tokens are ERC-20 tokens that can be traded on any exchange that supports the ERC-20 token standard. When they are created (through a process called “minting”), imBTC collateral is locked in the Market Protocol smart contract in return for long and short position tokens.
When an order is filled, a long position token and a short position token is created to represent the two sides of the contract. Position tokens are fungible within the same MRI_BTC contract with each position token representing 1TH/day for the duration of the contract.
 

## **Trading Mechanism**

The market for MRI_BTC_28 contracts is NOT one with a traditional Continuous Double Auction (CDA)* system as adopted by many traditional and centralized exchanges. It is an auction house type of market where the sellers place offers with prices and buyers decide whether to take those offers. Buyers are not able to place bids with their desired prices. One can also consider this as a one-sided CDA type system with only offers in its order book.

Although the Honeylemon interface does not support secondary market trading, buyers and sellers who hold the position tokens can directly trade the position tokens on decentralized exchanges such as Uniswap. 

* A CDA system is a system of match engines for a two-sided order book for bids and offers, as adopted by the NYSE or Bitmex for example.


## **No Forced Liquidation**

Since the payoff is capped and fully collateralized, no forced liquidation may occur.

## **Settlement**

BTC 28-Day Mining Revenue Contracts (MRI_BTC_28 contracts) settle at the earlier of the two:24-hours after contract expiration (normal settlement) and the unlikely event of a cap price breach before expiration (early settlement). 

If the cap price is not breached throughout the contract duration, the contract will be settled 24 hours after expiration. The settlement value will be the MRI_BTC_28 index.
The settlement timestamp is updated when the settlement value is last updated. 
Initial settlement value is typically set within minutes of the expiration timestamp but may also be updated in the event of a settlement arbitration.

### **Early Settlement**

In the event of MRI_BTC breaching the cap price prior to expiration, the contracts are settled 24 hours after the breach. In such cases, the settlement value for the long side will be the cap price, and the settlement value for the short side will be 0. 


