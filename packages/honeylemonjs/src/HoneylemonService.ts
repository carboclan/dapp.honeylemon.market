const { GraphQLClient } = require('graphql-request');
const { HttpClient, OrderbookRequest } = require('@0x/connect');
const { MinterBridge, MarketContractProxy, MarketContractMPX, CollateralToken, PaymentToken, DSProxy } = require('@honeylemon/contracts');

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
const PAYMENT_TOKEN_DECIMALS = 6; // USDT has 6 decimals
const COLLATERAL_TOKEN_DECIMALS = 8; // imBTC has 8 decimals
const SHIFT_PRICE_BY = TH_DECIMALS - PAYMENT_TOKEN_DECIMALS;
const CONTRACT_DURATION = 28; // Days
// const CONTRACT_DURATION = 2; // 2 day for Kovan deployment

class HoneylemonService {
  subgraphClient: any;
  minterBridgeAddress: any;
  marketContractProxyAddress: any;
  collateralTokenAddress: any;
  paymentTokenAddress: any;
  provider: any;
  chainId: any;
  contractWrappers: any;
  makerAssetData: any;
  takerAssetData: any;
  orderbookService: OrderbookService;
  collateralToken: any;
  paymentToken: any;
  marketContractProxy: any;
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
    this.subgraphClient = new GraphQLClient(subgraphUrl);
    this.minterBridgeAddress =
      minterBridgeAddress || MinterBridge.networks[chainId].address;
    this.marketContractProxyAddress =
      marketContractProxyAddress || MarketContractProxy.networks[chainId].address;
    this.collateralTokenAddress = collateralTokenAddress || CollateralToken.networks[chainId].address;
    this.paymentTokenAddress = paymentTokenAddress || PaymentToken.networks[chainId].address;
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

    // Instantiate OrderbookService
    this.orderbookService = new OrderbookService(
      apiUrl,
      minterBridgeAddress,
      marketContractProxyAddress,
      paymentTokenAddress
    );

    // Instantiate tokens
    this.collateralToken = new ERC20TokenContract(
      this.collateralTokenAddress,
      this.provider
    );
    this.paymentToken = new ERC20TokenContract(this.paymentTokenAddress, this.provider);

    this.marketContractProxy = new web3.eth.Contract(
      MarketContractProxy.abi,
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
      takerFillAmount = orderCalculationUtils.getTakerFillAmount(order, makerFillAmount);
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

  createOrder(makerAddress, sizeTh, pricePerTh, expirationTime?) {
    sizeTh = new BigNumber(sizeTh);
    pricePerTh = new BigNumber(pricePerTh);
    if (!expirationTime) {
      expirationTime = new BigNumber(Math.round(Date.now() / 1000) + 10 * 24 * 60 * 60); // 10 days
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
    return this.orderbookService.submitOrder(signedOrder);
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
    return this.orderbookService.getOrderbook();
  }

  async getOpenOrders(makerAddress) {
    return this.orderbookService.getOpenOrders(makerAddress);
  }

  async calculateRequiredCollateral(amount) {
    return await this.marketContractProxy.methods
      .calculateRequiredCollateral(amount.toString())
      .call();
  }

  async deployDSProxyContract(deployer) {
    const address = await this.marketContractProxy.methods
      .createDSProxyWallet()
      .call({ from: deployer });
    await this.marketContractProxy.methods.createDSProxyWallet().send({
      from: deployer,
      gas: 9000000
    });
    return address;
  }

  async getDSProxyAddress(ownerAddress) {
    const address = await this.marketContractProxy.methods
      .getUserAddressOrDSProxy(ownerAddress)
      .call({ from: ownerAddress });

    return address;
  }

  async addressHasDSProxy(address) {
    const DSProxyAddress = await this.marketContractProxy.methods
      .getUserAddressOrDSProxy(address)
      .call({ from: address });
    // if the address is not the same as the DSProxy address then the user has a DSProxy
    return DSProxyAddress.toLowerCase() != address.toLowerCase();
  }

  async batchRedeem(recipientAddress) {
    const dsProxyAddress = await this.marketContractProxy.methods
      .getUserAddressOrDSProxy(recipientAddress)
      .call();

    if (dsProxyAddress == recipientAddress) {
      console.error('User does not have DSProxy wallet');
      return null;
    }

    let traderDSProxy = new web3.eth.Contract(DSProxy.abi, dsProxyAddress);
    traderDSProxy.setProvider(this.provider);

    // Get position information for the recipient
    const { longPositions, shortPositions } = await this.getPositions(recipientAddress);

    // Place holders to return tx within if there was a batch redemption
    let redemptionTxLong = null,
      redemptionTxShort = null;

    // The trader could have entered into both long and short trades. Start with the long trade
    if (longPositions.length > 0) {
      let longParams = {
        tokenAddresses: [],
        numTokens: []
      };

      // For each trade they've entered, add the position information to the params.
      for (let position of longPositions) {
        if (position.canRedeem) {
          // Grab the index of the address within the array. This is done to group by address
          // As a trader could be in multiple instance of one token for each given day.
          const arrayIndex = longParams.tokenAddresses.findIndex(
            addr => addr == position.longTokenAddress
          );
          // If this is the only instance of the token then add to the end of the array
          if (arrayIndex == -1) {
            longParams.tokenAddresses.push(position.longTokenAddress);
            longParams.numTokens.push(position.qtyToMint);
          }
          // If this is not the only instance of this token then update the other previous
          // occupance with more tokens to redeem
          else {
            longParams.numTokens[arrayIndex] = (
              Number(longParams.numTokens[arrayIndex]) + Number(position.qtyToMint)
            ).toString();
          }
        }
      }
      // encode the function call to send to DSProxy
      const batchRedemptionLongTx = this.marketContractProxy.methods
        .batchRedeem(longParams.tokenAddresses, longParams.numTokens)
        .encodeABI();

      // Execute function call on DSProxy
      const method = traderDSProxy.methods.execute(
        this.marketContractProxyAddress,
        batchRedemptionLongTx
      );
      const gas = await method.estimateGas({ from: recipientAddress, gas: 9000000 });
      redemptionTxLong = await method.send({ from: recipientAddress, gas });
    }

    if (shortPositions.length > 0) {
      let shortParams = {
        tokenAddresses: [],
        numTokens: []
      };

      for (let position of shortPositions) {
        if (position.canRedeem) {
          const arrayIndex = shortParams.tokenAddresses.findIndex(
            addr => addr == position.shortTokenAddress
          );

          if (arrayIndex == -1) {
            shortParams.tokenAddresses.push(position.shortTokenAddress);
            shortParams.numTokens.push(position.qtyToMint);
          } else {
            shortParams.numTokens[arrayIndex] = (
              Number(shortParams.numTokens[arrayIndex]) + Number(position.qtyToMint)
            ).toString();
          }
        }
      }

      const batchRedemptionShortTx = this.marketContractProxy.methods
        .batchRedeem(shortParams.tokenAddresses, shortParams.numTokens)
        .encodeABI();

      const method = traderDSProxy.methods.execute(
        this.marketContractProxyAddress,
        batchRedemptionShortTx
      );
      const gas = await method.estimateGas({ from: recipientAddress, gas: 9000000 });
      redemptionTxShort = method.send({ from: recipientAddress, gas });
    }
    return { redemptionTxLong, redemptionTxShort };
  }

  async getPositions(address) {
    address = address.toLowerCase();
    const data = await this.subgraphClient.request(POSITIONS_QUERY, { address });
    if (!data.user)
      return {
        longPositions: [],
        shortPositions: []
      };

    const contracts = await this.getContracts(CONTRACT_DURATION);

    // TODO: additional processing, calculate total price by iterating over fills
    const shortPositionsProcessed = await this._processPositionsData(
      data.user.positionsAsMaker,
      contracts,
      true
    );
    const longPositionsProcessed = await this._processPositionsData(
      data.user.positionsAsTaker,
      contracts,
      false
    );

    return {
      longPositions: longPositionsProcessed,
      shortPositions: shortPositionsProcessed
    };
  }

  _mergePositions(positions, mergeByFunc) {
    const merged = positions.reduce((res, pos) => {
      const mergeBy = mergeByFunc(pos);
      const existing = res[mergeBy];
      if (existing) {
        // merge positions
        existing.qtyToMint = new BigNumber(existing.qtyToMint)
          .plus(pos.qtyToMint)
          .toString();
      } else {
        res[mergeBy] = pos;
      }
      return res;
    }, {});

    return Object.values(merged);
  }

  async _processPositionsData(positions, contracts, isShort) {
    // 1. merge positions by transaction in order to correctly represent fills and price
    positions = this._mergePositions(positions, pos => pos.transaction.id);

    // 2. merge positions by marketId
    positions = this._mergePositions(positions, pos => pos.marketId);

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
        const returnPerUnit = isShort
          ? collateralPerUnit.minus(revenuePerUnit)
          : revenuePerUnit;
        position.finalReward = returnPerUnit.multipliedBy(position.qtyToMint);
        position.pendingReward = position.finalReward;
      } else {
        // pending rewards
        let pendingRewardPerUnit = contracts
          .filter(c => parseInt(c.index) > parseInt(position.marketId))
          .reduce((sum, c) => sum.plus(c.currentMRI), new BigNumber(0));
        if (isShort) pendingRewardPerUnit = collateralPerUnit.minus(pendingRewardPerUnit);
        position.pendingReward = pendingRewardPerUnit.multipliedBy(position.qtyToMint);
      }
      // Tokens to redeem
      const positionToken = new ERC20TokenContract(
        isShort ? position.shortTokenAddress : position.longTokenAddress,
        this.provider
      );
      const dsProxyAddress = isShort
        ? position.shortTokenDSProxy
        : position.longTokenDSProxy;

      position.isRedeemed =
        (await positionToken.balanceOf(dsProxyAddress).callAsync()).toString() == '0'
          ? true
          : false;

      // position.tokensToRedeem = (x
      //   await positionToken.balanceOf(dsProxyAddress).callAsync()
      // ).toString();

      // Settlement delay
      const marketContract = new web3.eth.Contract(
        MarketContractMPX.abi,
        position.contract.id
      );
      marketContract.setProvider(this.provider);

      position.canRedeem =
        !position.isRedeemed &&
        (await marketContract.methods.isPostSettlementDelay().call());
    }

    return positions;
  }

  async getContracts(last = CONTRACT_DURATION) {
    const { contracts } = await this.subgraphClient.request(CONTRACTS_QUERY, { last });
    return contracts;
  }

  async isDailyContractDeployed() {
    const isContractDeployed = await this.marketContractProxy.methods
      .isDailyContractDeployed()
      .call();

    return isContractDeployed;
  }
}

class OrderbookService {
  apiClient: any;
  makerAssetData: any;
  takerAssetData: any;
  constructor(
    apiUrl,
    minterBridgeAddress,
    marketContractProxyAddress,
    paymentTokenAddress
  ) {
    this.apiClient = new HttpClient(apiUrl);
    // Calculate asset data
    this.makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
      marketContractProxyAddress,
      minterBridgeAddress,
      '0x0000'
    );
    this.takerAssetData = assetDataUtils.encodeERC20AssetData(paymentTokenAddress);
  }

  async getOrderbook() {
    const orderbookRequest = {
      baseAssetData: this.makerAssetData,
      quoteAssetData: this.takerAssetData
    };
    const orderbookResponse = await this.apiClient.getOrderbookAsync(orderbookRequest);

    this._processOrders(orderbookResponse.asks);

    return orderbookResponse;
  }

  async getOpenOrders(makerAddress) {
    const ordersResponse = await this.apiClient.getOrdersAsync({
      makerAddress: makerAddress.toLowerCase()
    });

    this._processOrders(ordersResponse);

    return ordersResponse;
  }

  // Calculate price and remainingFillableMakerAssetAmount
  _processOrders(ordersResponse) {
    ordersResponse.records.map(({ order, metaData }) => {
      metaData.price = order.takerAssetAmount
        .dividedBy(order.makerAssetAmount)
        .shiftedBy(SHIFT_PRICE_BY);

      metaData.remainingFillableMakerAssetAmount = orderCalculationUtils.getMakerFillAmount(
        order,
        new BigNumber(metaData.remainingFillableTakerAssetAmount)
      );
    });
  }

  async submitOrder(signedOrder) {
    return this.apiClient.submitOrderAsync(signedOrder);
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
      id
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

export {
  HoneylemonService,
  OrderbookService,
  PAYMENT_TOKEN_DECIMALS,
  COLLATERAL_TOKEN_DECIMALS,
  POSITIONS_QUERY,
  CONTRACTS_QUERY,
  CONTRACT_DURATION
};
