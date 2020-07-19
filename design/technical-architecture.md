---
description: >-
  This document explains the general technical architecture of Honellemon's
  synthetic Bitcoin mining contracts built on Ethereum.
---

# Technical Architecture

## **High-level overview**

Honeylemon has a number of interconnected components. Primarily, the market mechanism is built on the Market Protocol and the 0x Protocol, as well as a number of custom contract wrappers and proxies.

The market Protocol is used to create a Contract for Differences \(CFD\) between the miner and investor who each hold a short or long position token respectively. These tokens represent a “bet” on the future Bitcoin hash rate, expressed in miner Mining Revenue Index \(MRI\) Index. This represents the network daily average block rewards & fees earned in BTC per terahash \(TH\) of hash power.

The 0x Protocol is used to create an order book wherein miners can publish sell orders which are filled by investors. The orderbook is not a standard two-sided orderbook. Rather, miners can only place limit orders\(makers\) and investors can only fill orders\(takers\). This is to enable the traditional order flow of a cloud mining contract. The 0x orderbook is hosted using a modified version of 0x Mesh which enables unfilled order retrieval from the front end.

## **Transaction flow**

The diagram below shows a full order flow in the system.

![](https://lh5.googleusercontent.com/SzHftzXK_Bv6AAekJhuFZdbeBZtKyAVXFO-W2JyUCVwR8vd9FxVKaQlAZ7cgMxKfkODBbk4dVCcilQCMj6bn81qNbIWzU1Cn9jWStB45z3pbjpfSxjsyR_pIWaw2anX29Td1rLTB)

There are 3 main roles in the protocol: the Honeylemon **admin**, **Miner** and **Investor**. Below are scenarios that each of them perform.

#### **Honeylemon Admin**

- Everyday we deploy a new MarketContract, PositionTokenShort and PositionTokenLong. We register the latest MarketContract in MarketContractProxy in order to make it easier to interact with the latest deployed MarketContract.
- Honeylemon admin maintains an Oracle that posts daily BTC payoffs per 1Th on-chain. This data is used by the modified Market protocol contracts to calculate payoffs at settlement. For now, this is a centralized oracle operated by the team. In the future this component will be refined to be more trustless. The oracle provides several indexes for various purposes:
  - Current hashrate index - used to calculate collateral requirements at contract start \(this value doesn’t need to be onchain, it is used only when deploying daily Market contracts.
  - Last 28 days payoff index - used to calculate payoffs at contract settlement.

#### **Miner \(short trader\)**

1. Miner goes to the UI.
2. Miner enters the sale price and amount of TH they want to sell. The UI shows required wBTC collateral and whether there’s enough in the wallet \(otherwise order can’t be created\).
3. Gives approval to draw the collateral token \(wBTC\) from their wallet. MetaMask popup with ETH transaction - once per address.
4. The UI constructs a 0x order, opens MetaMask to sign it \(no transaction, just signature\).
5. Order is sent to the server to be stored in a DB \(0x relayer / mesh node\)
6. The miner optionally can ask the server to remove the order. Canceled orders require on-chain transactions.
7. Miners see their contracts with status: not filled, filled, partially filled, settled. The data for the list is read from chain checking all PositionTokens in the wallet as well as from the API using open 0x orders created by the current wallet.
8. After contract settlement miner can withdraw excess collateral from MarketCollateralPool contract by calling `MarketCollateralPool.settleAndClose`

#### **Investor \(long trader\)**

1. Investor goes to the UI, sees the best price based on all current orders. They have no optionality; always offered the best market price.
2. Investor enters TH amount they want to buy. The UI recalculates the final price \(in case multiple orders are required to fill the size\).
3. Gives approval to draw USDT token from their wallet. MetaMask popup with ETH transaction - once per address.
4. Investor submits Ethereum transaction to fill the order with 0x protocol
5. Once the tx is mined both miner and investor receive Market position tokens
6. After contract settlement investor can claim wBTC reward from MarketCollateralPool contract by calling `MakerCollateralPool.settleAndClose`.

## **DSProxy wallets**

The miner and the investor have the option to deploy a `DSProxy` wallet to simplify batch token redemption. `DSProxy` smart contract wallet that can be used to receive Long and Short position tokens on the investor and miners behalf. DSProxy enables a user to perform complex batch operations on-chain in one block. Each daily market protocol contract deployment creates two associated ERC20 tokens \(long & short\). Without a `DSProxy` wallet, a token holder will need to a\) approve and b\) call `settleAndClose` on each days contract they entered into. In some cases this could be a considerable number of transactions. If a miner has, for example, sold contracts over 2 months they will need to submit 60 transactions to redeem all their short tokens. Using `DSProxy` this can be batched to be executed in one transaction to drastically improve the UX. One downside with `DSProxy` is, however, it’s initial deployment gas cost but this is outweighed by the savings from batch redemption.

---

## **MarketProtocol Contracts and 0x Interconnection**

0x v3 [ERC20Bridge](https://github.com/0xProject/0x-protocol-specification/blob/master/asset-proxy/erc20-bridge-proxy.md#writing-an-erc20bridge-contract) contract enables custom logic execution on order fill. That logic can mint Market protocol position tokens \([see here](https://docs.marketprotocol.io/#minting-and-redemption)\) and distribute them to buyer and seller atomically within a single 0x ‘fillOrder’ transaction. Such orders are fully-compatible with the rest of 0x infrastructure and libraries. The diagram below shows the interconnection of all technical components in the system.

---

![](https://docs.google.com/drawings/u/0/d/ssjk9gFk0X4bTO1amEQ-abw/image?w=701&h=493&rev=574&ac=1&parent=1wJ6y9ilm7suwSymimne2WPdiwIj0rEUWC3Lf56o_VWQ)

---

## **Smart Contracts**

The custom smart contracts in the honey lemon system are now briefly discussed. Contracts outside of 0x protocol and Market protocol are:

- \*\*\*\*[**MarketContractProxy**](https://github.com/carboclan/dapp.honeylemon.market/blob/master/contracts/honeylemon/MarketContractProxy.sol) - responsible for deploying, settlement and keeping the list of daily MarketContract and PositionToken instances. Proxies market protocol position token minting to the daily contract. Emits an event that our indexer captures to keep track of all entered contracts and their prices.
- \*\*\*\*[**MinterBridge**](https://github.com/carboclan/dapp.honeylemon.market/blob/master/contracts/honeylemon/MinterBridge.sol) - an implementation of 0x [ERC20Bridge](https://github.com/0xProject/0x-protocol-specification/blob/master/asset-proxy/erc20-bridge-proxy.md#writing-an-erc20bridge-contract) that enables custom logic execution on 0x order fill. Interacts with MarketContractProxy to mint position tokens.
- \*\*\*\*[**DSProxy**](https://github.com/carboclan/dapp.honeylemon.market/blob/master/contracts/honeylemon/DSProxy.sol) - an instance is deployed for each user to enable redemption of multiple position tokens at once. Position tokens are minted to DSProxy, this allows users to redeem multiple contracts in a single transaction, without having to give approval for each position token \(this is particularly useful for miners who are likely to hold multiple contracts\).

All contracts in the honey lemon service have been audited by PeckShield. The report can be found here.

## **Backend Components**

- **0x API** - used by the front-end to store signed 0x orders. Keeps track of order state and fillable amounts. Returns a sorted order book of fillable orders. Interacts with 0x Mesh instance to perform some of the functions. We use the API docker image as-is.
- **0x Mesh** - is used by 0x API to keep track of order states and fillable amounts. We had to fork the code and modify the logic that calculates order fillable amount.
- **Graph Protocol node** - indexes on-chain events and provides a GraphQL API to query them. Is used by the front-end to get the list of current/expired contracts.
- **Postgres DB** - stores data for 0x API and the Graph Node.
- **IPFS node** - is used by the graph node.

**See** [**docker-compose**](https://github.com/carboclan/dapp.honeylemon.market/blob/master/docker/docker-compose-local.yml) **for details.**
