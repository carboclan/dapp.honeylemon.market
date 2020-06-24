# Financial Design

## **Introduction**

The Honeylemon Mining Revenue Contract is the first of a series of Mining Revenue Contracts designed to replicate payoff of existing cloud mining.

The Honeylemon 28-Day Mining Revenue Contract is a forward-like product that settles to the market-wide block reward and fees per Terahash over 28 days as published in the BTC Mining Revenue Index \(BTC\_MRI\), with a 125% max revenue cap for the buyer. The buyer pays a fixed price in stable coin \(USDT\) upfront and later receives the mining output in ERC-20 representation of BTC \(imBTC\) upon contract settlement. Honeylemon contracts are built upon Market Protocol and 0x Protocol v3. 

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

### Design Considerations

* The index MUST have a clear physical meaning.
* The index SHOULD closely replicate miners’ revenue in reality. 
* The index SHOULD make the contract easy for miners to trade in order to hedge the risk exposure of mining practice over some certain period of time.
* The index SHOULD be consistent with the mining industry conventional practices. MRI follows the mining industry convention of Full Pay-Per-Share \(FPPS\) approach.

