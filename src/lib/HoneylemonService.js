const { GraphQLClient } = require('graphql-request');
const { HttpClient, OrderbookRequest } = require('@0x/connect');
const MinterBridgeArtefacts = require('../../build/contracts/MinterBridge.json');
const MarketContractProxyArtefacts = require('../../build/contracts/MarketContractProxy.json');
const CollateralTokenArtefacts = require('../../build/contracts/CollateralToken.json');
const PaymentTokenArtefacts = require('../../build/contracts/PaymentToken.json');

const {
  marketUtils,
  generatePseudoRandomSalt,
  signatureUtils,
  assetDataUtils,
  orderCalculationUtils
} = require('@0x/order-utils');
const { ContractWrappers, ERC20TokenContract } = require('@0x/contract-wrappers');
const { BigNumber } = require('@0x/utils');
const Web3 = require('web3');
const web3 = new Web3(null); // This is just for encoding, etc.

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const ORDER_FILL_GAS = 150000;
const TH_DECIMALS = 0; // TH has 6 decimals
const PAYMENT_TOKEN_DECIMALS = 6; // USDC has 6 decimals
const COLLATERAL_TOKEN_DECIMALS = 8; // imBTC has 8 decimals
const SHIFT_PRICE_BY = TH_DECIMALS - PAYMENT_TOKEN_DECIMALS;

class HoneylemonService {
  constructor(
    apiUrl,
    subgraphUrl,
    provider, //This should be a 0x Subprovider wrapped provider
    chainId,
    minterBridgeAddress,
    marketContractProxyAddress,
    collateralTokenAddress,
    paymentTokenAddress
  ) {
    this.apiClient = new HttpClient(apiUrl);
    this.subgraphClient = new GraphQLClient(subgraphUrl);
    this.minterBridgeAddress =
      minterBridgeAddress || MinterBridgeArtefacts.networks[chainId].address;
    this.marketContractProxyAddress =
      marketContractProxyAddress ||
      MarketContractProxyArtefacts.networks[chainId].address;
    this.collateralTokenAddress =
      collateralTokenAddress || CollateralTokenArtefacts.networks[chainId].address;
    this.paymentTokenAddress =
      paymentTokenAddress || PaymentTokenArtefacts.networks[chainId].address;
    this.provider = provider;
    this.chainId = chainId;

    this.contractWrappers = new ContractWrappers(this.provider, { chainId });

    // Calculate asset data
    this.makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
      this.marketContractProxyAddress,
      this.minterBridgeAddress,
      '0x0000'
    );
    this.takerAssetData = assetDataUtils.encodeERC20AssetData(this.paymentTokenAddress);

    // Instantiate tokens
    this.collateralToken = new ERC20TokenContract(
      this.collateralTokenAddress,
      this.provider
    );
    this.paymentToken = new ERC20TokenContract(this.paymentTokenAddress, this.provider);

    this.marketContractProxy = new web3.eth.Contract(
      MarketContractProxyArtefacts.abi,
      this.marketContractProxyAddress
    );

    this.marketContractProxy.setProvider(this.provider);
    console.log('Honeylemon service initiated!');
  }

  async getCollateralForContract(sizeTh) {
    const result = await this.marketContractProxy.methods
      .calculateRequiredCollateral(sizeTh)
      .call();
    return result;
  }

  async getQuoteForSize(sizeTh) {
    const { asks } = await this.getOrderbook();
    const orders = asks.records.map(r => r.order);
    const remainingFillableMakerAssetAmounts = asks.records.map(r =>
      new BigNumber(r.metaData.remainingFillableTakerAssetAmount)
        .multipliedBy(r.order.makerAssetAmount)
        .dividedBy(r.order.takerAssetAmount)
    );
    const {
      resultOrders,
      ordersRemainingFillableMakerAssetAmounts,
      remainingFillAmount
    } = marketUtils.findOrdersThatCoverMakerAssetFillAmount(orders, sizeTh, {
      remainingFillableMakerAssetAmounts
    });

    // Calculate total price
    const makerAssetFillAmounts = [];
    const takerAssetFillAmounts = [];
    let totalMakerFillAmount = new BigNumber(0);
    let totalTakerFillAmount = new BigNumber(0);
    let remainingSize = new BigNumber(sizeTh);
    for (let i = 0; i < resultOrders.length; i++) {
      const order = resultOrders[i];
      const makerFillAmount = BigNumber.min(
        ordersRemainingFillableMakerAssetAmounts[i],
        remainingSize
      );
      const takerFillAmount = orderCalculationUtils.getTakerFillAmount(
        order,
        makerFillAmount
      );
      totalMakerFillAmount = totalMakerFillAmount.plus(makerFillAmount);
      totalTakerFillAmount = totalTakerFillAmount.plus(takerFillAmount);

      makerAssetFillAmounts[i] = makerFillAmount;
      takerAssetFillAmounts[i] = takerFillAmount;
      remainingSize = remainingSize.minus(makerFillAmount);
    }
    const price = totalTakerFillAmount
      .dividedBy(totalMakerFillAmount)
      .shiftedBy(SHIFT_PRICE_BY);

    return {
      price,
      resultOrders,
      ordersRemainingFillableMakerAssetAmounts,
      makerAssetFillAmounts,
      takerAssetFillAmounts,
      remainingMakerFillAmount: remainingFillAmount,
      totalMakerFillAmount,
      totalTakerFillAmount
    };
  }

  async getQuoteForBudget(budget) {
    budget = new BigNumber(budget).shiftedBy(PAYMENT_TOKEN_DECIMALS).integerValue();
    const { asks } = await this.getOrderbook();
    const orders = asks.records.map(r => r.order);
    const remainingFillableTakerAssetAmounts = asks.records.map(
      r => new BigNumber(r.metaData.remainingFillableTakerAssetAmount)
    );
    const {
      resultOrders,
      ordersRemainingFillableTakerAssetAmounts,
      remainingFillAmount
    } = marketUtils.findOrdersThatCoverTakerAssetFillAmount(orders, budget, {
      remainingFillableTakerAssetAmounts
    });

    // Calculate total price and takerAssetFillAmounts
    const makerAssetFillAmounts = [];
    const takerAssetFillAmounts = [];
    let totalMakerFillAmount = new BigNumber(0);
    let totalTakerFillAmount = new BigNumber(0);
    let remainingBudget = new BigNumber(budget);
    for (let i = 0; i < resultOrders.length; i++) {
      const order = resultOrders[i];
      let takerFillAmount = BigNumber.min(
        ordersRemainingFillableTakerAssetAmounts[i],
        remainingBudget
      );
      const makerFillAmount = orderCalculationUtils.getMakerFillAmount(
        order,
        takerFillAmount
      );
      // Recalculate takerFillAmount based on whole makerFillAmount
      takerFillAmount = orderCalculationUtils.getTakerFillAmount(
        order,
        makerFillAmount
      );
      totalMakerFillAmount = totalMakerFillAmount.plus(makerFillAmount);
      totalTakerFillAmount = totalTakerFillAmount.plus(takerFillAmount);

      makerAssetFillAmounts[i] = makerFillAmount;
      takerAssetFillAmounts[i] = takerFillAmount;
      remainingBudget = remainingBudget.minus(takerFillAmount);
    }
    const price = totalTakerFillAmount
      .dividedBy(totalMakerFillAmount)
      .shiftedBy(SHIFT_PRICE_BY);

    return {
      price,
      resultOrders,
      ordersRemainingFillableTakerAssetAmounts,
      takerAssetFillAmounts,
      makerAssetFillAmounts,
      remainingTakerFillAmount: remainingFillAmount,
      totalMakerFillAmount,
      totalTakerFillAmount
    };
  }

  async get0xFeeForOrderBatch(gasPrice, batchSize) {
    const protocolFeeMultiplier = await this.contractWrappers.exchange
      .protocolFeeMultiplier()
      .callAsync();
    return new BigNumber(protocolFeeMultiplier)
      .multipliedBy(gasPrice)
      .multipliedBy(batchSize);
  }

  async estimateGas(signedOrders, takerAssetFillAmounts, takerAddress) {
    const signatures = signedOrders.map(o => o.signature);
    const gasPrice = 10e9; // Set to 10GWEI
    const value = await this.get0xFeeForOrderBatch(gasPrice, signedOrders.length);

    const gas = await this.contractWrappers.exchange
      .batchFillOrKillOrders(signedOrders, takerAssetFillAmounts, signatures)
      .estimateGasAsync({ from: takerAddress, value, gasPrice });

    return gas;
  }

  getFillOrdersTx(signedOrders, takerAssetFillAmounts) {
    const signatures = signedOrders.map(o => o.signature);
    return this.contractWrappers.exchange.batchFillOrKillOrders(
      signedOrders,
      takerAssetFillAmounts,
      signatures
    );
  }

  // TODO: Accept an order hash as parameter
  getCancelOrderTx(order) {
    return this.contractWrappers.exchange.cancelOrder(order);
  }

  createOrder(makerAddress, sizeTh, pricePerTh, expirationTime) {
    sizeTh = new BigNumber(sizeTh);
    pricePerTh = new BigNumber(pricePerTh);
    if (!expirationTime) {
      expirationTime = new BigNumber(
        Math.round(Date.now() / 1000) + 10 * 24 * 60 * 60
      ); // 10 days
    }
    const exchangeAddress = this.contractWrappers.exchange.address;

    const order = {
      makerAddress, // maker is the first address (miner)
      takerAddress: NULL_ADDRESS, // taker is open and can be filled by anyone (when an investor comes along)
      makerAssetAmount: sizeTh, // The maker asset amount
      takerAssetAmount: sizeTh
        .multipliedBy(pricePerTh)
        .shiftedBy(-SHIFT_PRICE_BY)
        .integerValue(), // The taker asset amount
      expirationTimeSeconds: new BigNumber(expirationTime), // Time when this order expires
      makerFee: new BigNumber(0), // 0 maker fees
      takerFee: new BigNumber(0), // 0 taker fees
      feeRecipientAddress: NULL_ADDRESS, // No fee recipient
      senderAddress: NULL_ADDRESS, // Sender address is open and can be submitted by anyone
      salt: generatePseudoRandomSalt(), // Random value to provide uniqueness
      makerAssetData: this.makerAssetData,
      takerAssetData: this.takerAssetData,
      exchangeAddress,
      makerFeeAssetData: '0x',
      takerFeeAssetData: '0x',
      chainId: this.chainId
    };

    return order;
  }

  async signOrder(order) {
    const signedOrder = await signatureUtils.ecSignOrderAsync(
      this.provider,
      order,
      order.makerAddress
    );

    return signedOrder;
  }

  async submitOrder(signedOrder) {
    return this.apiClient.submitOrderAsync(signedOrder);
  }

  async checkCollateralTokenApproval(ownerAddress, amount) {
    amount = amount || new BigNumber(2).pow(256).minus(1);

    const allowance = BigNumber(
      await this.collateralToken
        .allowance(this.minterBridgeAddress, ownerAddress)
        .callAsync()
    );

    return !!allowance.isGreaterThanOrEqualTo(amount);
  }

  async approveCollateralToken(makerAddress, amount) {
    amount = amount || new BigNumber(2).pow(256).minus(1);
    return await this.collateralToken
      .approve(this.minterBridgeAddress, amount)
      .awaitTransactionSuccessAsync({
        from: makerAddress
      });
  }

  async checkPaymentTokenApproval(ownerAddress, amount) {
    amount = amount || new BigNumber(2).pow(256).minus(1);

    const allowance = BigNumber(
      await this.paymentToken
        .allowance(this.minterBridgeAddress, ownerAddress)
        .callAsync()
    );

    return !!allowance.isGreaterThanOrEqualTo(amount);
  }

  async approvePaymentToken(takerAddress, amount) {
    amount = amount || new BigNumber(2).pow(256).minus(1);
    return await this.paymentToken
      .approve(this.contractWrappers.contractAddresses.erc20Proxy, amount)
      .awaitTransactionSuccessAsync({
        from: takerAddress
      });
  }

  async getCollateralTokenAmounts(makerAddress) {
    const allowance = await this.collateralToken
      .allowance(makerAddress, this.minterBridgeAddress)
      .callAsync();
    const balance = await this.collateralToken.balanceOf(makerAddress).callAsync();

    return { allowance, balance };
  }

  async getPaymentTokenAmounts(takerAddress) {
    const allowance = await this.paymentToken
      .allowance(takerAddress, this.contractWrappers.contractAddresses.erc20Proxy)
      .callAsync();
    const balance = await this.paymentToken.balanceOf(takerAddress).callAsync();

    return { allowance, balance };
  }

  async getOrderbook() {
    const orderbookRequest = {
      baseAssetData: this.makerAssetData,
      quoteAssetData: this.takerAssetData
    };
    return this.apiClient.getOrderbookAsync(orderbookRequest);
  }

  async getOpenOrders(makerAddress) {
    const ordersResponse = await this.apiClient.getOrdersAsync({ makerAddress });
    ordersResponse.records.map(({ order, metaData }) => {
      metaData.price = order.takerAssetAmount
        .dividedBy(order.makerAssetAmount)
        .shiftedBy(SHIFT_PRICE_BY);

      metaData.remainingFillableMakerAssetAmount = orderCalculationUtils.getMakerFillAmount(
        order,
        metaData.remainingFillableTakerAssetAmount
      );
    });

    return ordersResponse;
  }

  async calculateRequiredCollateral(amount) {
    return await this.marketContractProxy.methods
      .calculateRequiredCollateral(amount)
      .call();
  }

  async getPositions(address) {
    address = address.toLowerCase();
    const data = await this.subgraphClient.request(POSITIONS_QUERY, { address });
    if (!data.user) return {
      longPositions: [],
      shortPositions: []
    }

    const contracts = await this.getContracts(28);

    // TODO: additional processing, calculate total price by iterating over fills
    const shortPositionsProcessed = await this._processPositionsData(data.user.positionsAsMaker, contracts, true);
    const longPositionsProcessed = await this._processPositionsData(data.user.positionsAsTaker, contracts, false);

    return {
      longPositions: longPositionsProcessed,
      shortPositions: shortPositionsProcessed
    };
  }

  async _processPositionsData(positions, contracts, short) {
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];

      // price
      let totalMakerAssetFilledAmount = new BigNumber(0);
      let totalTakerAssetFilledAmount = new BigNumber(0);
      for (let j = 0; j < position.transaction.fills.length; j++) {
        const makerAssetFilledAmount = new BigNumber(
          position.transaction.fills[j].makerAssetFilledAmount
        );
        const takerAssetFilledAmount = new BigNumber(
          position.transaction.fills[j].takerAssetFilledAmount
        );
        totalMakerAssetFilledAmount = totalMakerAssetFilledAmount.plus(
          makerAssetFilledAmount
        );
        totalTakerAssetFilledAmount = totalTakerAssetFilledAmount.plus(
          takerAssetFilledAmount
        );
      }
      position.price = totalTakerAssetFilledAmount
        .dividedBy(totalMakerAssetFilledAmount)
        .shiftedBy(SHIFT_PRICE_BY);

      // final rewards
      const collateralPerUnit = new BigNumber(position.contract.collateralPerUnit);
      position.finalReward = new BigNumber(0);
      if (position.contract.settlement) {
        const revenuePerUnit = new BigNumber(position.contract.settlement.revenuePerUnit);
        const returnPerUnit = short ? collateralPerUnit.minus(revenuePerUnit) : revenuePerUnit;
        position.finalReward = returnPerUnit.multipliedBy(position.qtyToMint);
        position.pendingReward = position.finalReward;
      } else {
        // pending rewards
        let pendingRewardPerUnit = contracts
          .filter(c => parseInt(c.index) > parseInt(position.marketId))
          .reduce((sum, c) => sum.plus(c.currentMRI), new BigNumber(0));
        if (short) pendingRewardPerUnit = collateralPerUnit.minus(pendingRewardPerUnit);
        position.pendingReward = pendingRewardPerUnit.multipliedBy(position.qtyToMint);
      }
    }

    return positions;
  }

  async getContracts(last = 28) {
    const { contracts } = await this.subgraphClient.request(CONTRACTS_QUERY, { last });
    return contracts;
  }

  async redeemContract(someContractIdentifier, address) {
    // TODO
  }
}

const POSITIONS_QUERY = /* GraphQL */ `
  fragment PositionFragment on Position {
    id
    createdAt
    marketId
    contractName
    qtyToMint
    contract {
      id
      index
      expiration
      collateralPerUnit
      settlement {
        revenuePerUnit
      }
    }
    time
    contractName
    longTokenAddress
    shortTokenAddress
    longTokenDSProxy
    shortTokenDSProxy
    longTokenRecipient {
      id
    }
    shortTokenRecipient {
      id
    }
    transaction {
      blockNumber
      fills {
        makerAssetFilledAmount
        takerAssetFilledAmount
      }
    }
  }

  query($address: ID!) {
    user(id: $address) {
      positionsAsMaker(orderBy: createdAt) {
        ...PositionFragment
      }
      positionsAsTaker(orderBy: createdAt) {
        ...PositionFragment
      }
    }
  }
`;

const CONTRACTS_QUERY = /* GraphQL */ `
  query($last: Int!) {
    contracts(orderBy: index, orderDirection: desc, first: $last) {
      id
      createdAt
      currentMRI
      contractName
      index
      collateralPerUnit
    }
  }
`;

module.exports =  { HoneylemonService, PAYMENT_TOKEN_DECIMALS, COLLATERAL_TOKEN_DECIMALS, POSITIONS_QUERY, CONTRACTS_QUERY };
