const { HttpClient, OrderbookRequest } = require('@0x/connect');
const {
  marketUtils,
  generatePseudoRandomSalt,
  signatureUtils,
  assetDataUtils,
  orderCalculationUtils
} = require('@0x/order-utils');
const { ContractWrappers, ERC20TokenContract } = require('@0x/contract-wrappers');
const { BigNumber } = require('@0x/utils');

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const ORDER_FILL_GAS = 150000;

class HoneylemonService {
  constructor(
    apiUrl,
    minterBridgeAddress,
    marketContractProxyAddress,
    collateralTokenAddress,
    paymentTokenAddress,
    provider,
    chainId
  ) {
    this.apiClient = new HttpClient(apiUrl);
    this.minterBridgeAddress = minterBridgeAddress;
    this.marketContractProxyAddress = marketContractProxyAddress;
    this.collateralTokenAddress = collateralTokenAddress;
    this.paymentTokenAddress = paymentTokenAddress;
    this.provider = provider;
    this.chainId = chainId;
    this.contractWrappers = new ContractWrappers(provider, { chainId });

    // Calculate asset data
    this.makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
      marketContractProxyAddress,
      minterBridgeAddress,
      '0x0000'
    );
    this.takerAssetData = assetDataUtils.encodeERC20AssetData(paymentTokenAddress);

    // Instantiate tokens
    this.collateralToken = new ERC20TokenContract(collateralTokenAddress, provider);
    this.paymentToken = new ERC20TokenContract(paymentTokenAddress, provider);
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

      takerAssetFillAmounts[i] = takerFillAmount;
      remainingSize = remainingSize.minus(makerFillAmount);
    }
    const price = totalTakerFillAmount.dividedBy(totalMakerFillAmount);

    return {
      price,
      resultOrders,
      ordersRemainingFillableMakerAssetAmounts,
      takerAssetFillAmounts,
      remainingFillAmount
    };
  }

  async getQuoteForBudget(budget) {
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
    const takerAssetFillAmounts = [];
    let totalMakerFillAmount = new BigNumber(0);
    let totalTakerFillAmount = new BigNumber(0);
    let remainingBudget = new BigNumber(budget);
    for (let i = 0; i < resultOrders.length; i++) {
      const order = resultOrders[i];
      const takerFillAmount = BigNumber.min(
        ordersRemainingFillableTakerAssetAmounts[i],
        remainingBudget
      );
      const makerFillAmount = orderCalculationUtils.getMakerFillAmount(
        order,
        takerFillAmount
      );
      totalMakerFillAmount = totalMakerFillAmount.plus(makerFillAmount);
      totalTakerFillAmount = totalTakerFillAmount.plus(takerFillAmount);

      takerAssetFillAmounts[i] = takerFillAmount;
      remainingBudget = remainingBudget.minus(takerFillAmount);
    }
    const price = totalTakerFillAmount.dividedBy(totalMakerFillAmount);

    return {
      price,
      resultOrders,
      ordersRemainingFillableTakerAssetAmounts,
      takerAssetFillAmounts,
      remainingFillAmount
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

  getCancelOrderTx(order) {
    return this.contractWrappers.exchange.cancelOrder(order);
  }

  createOrder(makerAddress, sizeTh, pricePerTh) {
    sizeTh = new BigNumber(sizeTh);
    pricePerTh = new BigNumber(pricePerTh);
    const expirationTime = new BigNumber(
      Math.round(Date.now() / 1000) + 10 * 24 * 60 * 60
    ); // 10 days
    const exchangeAddress = this.contractWrappers.exchange.address;

    const order = {
      makerAddress, // maker is the first address (miner)
      takerAddress: NULL_ADDRESS, // taker is open and can be filled by anyone (when an investor comes along)
      makerAssetAmount: sizeTh, // The maker asset amount
      takerAssetAmount: sizeTh.multipliedBy(pricePerTh), // The taker asset amount
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

  async approveCollateralToken(makerAddress, amount) {
    amount = amount || new BigNumber(2).pow(256).minus(1);
    return this.collateralToken
      .approve(this.minterBridgeAddress, amount)
      .sendTransactionAsync({
        from: makerAddress
      });
  }

  async approvePaymentToken(takerAddress, amount) {
    amount = amount || new BigNumber(2).pow(256).minus(1);
    return this.paymentToken
      .approve(this.contractWrappers.contractAddresses.erc20Proxy, amount)
      .sendTransactionAsync({
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
    return this.apiClient.getOrdersAsync({ makerAddress });
  }

  async getOpenContracts(address) {
    // TODO
  }

  async getRedeemableContracts(address) {
    // TODO
  }

  async getClosedContracts(address) {
    // TODO
  }

  async redeemContract(someContractIdentifier, address) {
    // TODO
  }
}

module.exports = HoneylemonService;
