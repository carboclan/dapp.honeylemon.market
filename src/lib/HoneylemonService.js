const { HttpClient, OrderbookRequest } = require('@0x/connect');
const {
  marketUtils,
  generatePseudoRandomSalt,
  signatureUtils,
  assetDataUtils,
  orderCalculationUtils
} = require('@0x/order-utils');
const { ContractWrappers, ERC20TokenContract } = require('@0x/contract-wrappers');
const { MetamaskSubprovider } = require('@0x/subproviders');
const { BigNumber } = require('@0x/utils');

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const ORDER_FILL_GAS = 150000;

class HoneyLemonService {
  constructor(
    apiUrl,
    minterBridgeAddress,
    marketContractProxyAddress,
    collateralTokenAddress,
    paymentTokenAddress,
    web3,
    chainId,
    marketContractProxyAbi,
    MarketCollateralPoolAbi,
    marketContractAbi
  ) {
    this.apiClient = new HttpClient(apiUrl);
    this.minterBridgeAddress = minterBridgeAddress;
    this.marketContractProxyAddress = marketContractProxyAddress;
    this.collateralTokenAddress = collateralTokenAddress;
    this.paymentTokenAddress = paymentTokenAddress;
    this.web3 = web3;

    this.provider = this.web3.currentProvider; //TODO This provider should be wrapped in the 0x/subprovider
    this.chainId = chainId;
    this.contractWrappers = new ContractWrappers(this.provider, { chainId });

    // Calculate asset data
    this.makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
      marketContractProxyAddress,
      minterBridgeAddress,
      '0x0000'
    );
    this.takerAssetData = assetDataUtils.encodeERC20AssetData(paymentTokenAddress);

    // Instantiate tokens
    this.collateralToken = new ERC20TokenContract(collateralTokenAddress, this.provider);
    this.paymentToken = new ERC20TokenContract(paymentTokenAddress, this.provider);

    this.marketContractProxy = new web3.eth.Contract(
      marketContractProxyAbi,
      marketContractProxyAddress
    );
    console.log("Honeylemon service initiated!")
  }

  async getCollateralForContract(sizeTh) {
    const result = await this.marketContractProxy.methods.calculateRequiredCollateral(sizeTh).call();
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

    // Encode the price of the sale into the maker asset data feed. This is used to pass the price to the
    // honey lemon market contract proxy to enrich the sale event to make retrieval easier on the front end.
    const makerAddetDataIncludingPrice = assetDataUtils.encodeERC20BridgeAssetData(
      this.marketContractProxyAddress,
      this.minterBridgeAddress,
      this.web3.utils.utf8ToHex(pricePerTh.toString()) // this is the sale price within the data feed for the minterbride
    );
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
      makerAssetData: makerAddetDataIncludingPrice,
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

  async getContracts(address) {
    // Get contract events where the address was the long trader
    const longPositionTokensMintedEvents = await this.marketContractProxy.getPastEvents(
      'PositionTokensMinted',
      {
        filter: { longTokenRecipient: address },
        fromBlock: 0,
        toBlock: 'latest'
      }
    );
    // Process the returned events
    const longContractsProcessed = this.processEventObjects(
      'long',
      longPositionTokensMintedEvents
    );

    // Get contract events where the address was the short trader
    const shortPositionTokensMintedEvents = await this.marketContractProxy.getPastEvents(
      'PositionTokensMinted',
      {
        filter: { shortTokenRecipient: address },
        fromBlock: 0,
        toBlock: 'latest'
      }
    );
    // Process the returned events
    const shortContractsProcessed = this.processEventObjects(
      'long',
      shortPositionTokensMintedEvents
    );

    return {
      longContracts: longContractsProcessed,
      shortContracts: shortContractsProcessed
    };
  }

  async redeemContract(someContractIdentifier, address) {
    // TODO
  }

  processEventObjects = (traderDirection, eventsArray) => {
    let contractsProcessed = {};
    eventsArray.forEach(contract => {
      // If the object does not exist init it
      if (!contractsProcessed[contract.returnValues.marketId]) {
        contractsProcessed[contract.returnValues.marketId] = {
          marketId: contract.returnValues.marketId,
          contractName: contract.returnValues.contractName.replace(/[^ -~]+/g, ''),
          marketContractAddress: contract.returnValues.latestMarketContract,
          direction: traderDirection,
          totalQuantity: parseInt(contract.returnValues.qtyToMint),
          averagePrice: parseInt(web3.utils.hexToUtf8(contract.returnValues.bridgeData)),
          trades: [
            {
              timeStamp: contract.returnValues.time,
              quantity: parseInt(contract.returnValues.qtyToMint),
              price: parseInt(web3.utils.hexToUtf8(contract.returnValues.bridgeData))
            }
          ],
          longTokenAddress: contract.returnValues.longTokenAddress,
          shortTokenAddress: contract.returnValues.shortTokenAddress,
          counterParty:
            traderDirection == 'long'
              ? contract.returnValues.shortTokenRecipient
              : contract.returnValues.longTokenRecipient,
          status: 'open' // will be changed if this spesific
        };
        // if the object already exists add the trade to the trades array
      } else {
        // Add the trade to the trades array
        contractsProcessed[contract.returnValues.marketId].trades.push({
          timeStamp: contract.returnValues.time,
          quantity: parseInt(contract.returnValues.qtyToMint),
          price: parseInt(web3.utils.hexToUtf8(contract.returnValues.bridgeData))
        });
        // Update the total quantity for this contract for the given marketId
        contractsProcessed[contract.returnValues.marketId].totalQuantity =
          contractsProcessed[contract.returnValues.marketId].totalQuantity +
          parseInt(contract.returnValues.qtyToMint);

        // Calculate the average sale price for this contract for the given marketId
        // by finding total spent and the total TH bought.
        let totalSpent = 0;
        contractsProcessed[contract.returnValues.marketId].trades.forEach(trade => {
          totalSpent = totalSpent + trade.price * trade.quantity;
        });

        contractsProcessed[contract.returnValues.marketId].averagePrice =
          totalSpent / contractsProcessed[contract.returnValues.marketId].totalQuantity;
      }
    });
    return contractsProcessed;
  };
}

module.exports = HoneyLemonService;