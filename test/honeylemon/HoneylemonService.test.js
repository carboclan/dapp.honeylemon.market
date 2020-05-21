// Helpers
const { BigNumber } = require('@0x/utils');
const { Web3Wrapper } = require('@0x/web3-wrapper');
const { orderHashUtils } = require('@0x/order-utils');
const sinon = require('sinon');
const { time } = require('@openzeppelin/test-helpers');

const MinterBridge = artifacts.require('MinterBridge');
const MarketContractProxy = artifacts.require('MarketContractProxy');
const CollateralToken = artifacts.require('CollateralToken'); // IMBTC
const PaymentToken = artifacts.require('PaymentToken'); // USDC
const MarketContractMPX = artifacts.require('MarketContractMPX');
const PositionToken = artifacts.require('PositionToken'); // Long & Short tokens
const MarketCollateralPool = artifacts.require('MarketCollateralPool');

const { HoneylemonService, CONTRACTS_QUERY } = require('../../src/lib/HoneylemonService');
const { revertToSnapShot, takeSnapshot } = require('../helpers/snapshot');

const web3Wrapper = new Web3Wrapper(web3.currentProvider);

const PAYMENT_TOKEN_DECIMALS = 6; // USDC has 6 decimals

let accounts = null,
  // addresses
  makerAddress = [null],
  takerAddress = null,
  randomAddress = null,
  // contracts
  ownerAddress = null,
  longToken = [null],
  shortToken = [null],
  marketContractProxy = null,
  // variables
  currentDayCounter = 0,
  mriInput = null,
  currentMRIScaled = null,
  // tested service
  honeylemonService = null;

before(async function() {
  accounts = await web3Wrapper.getAvailableAddressesAsync();
  ownerAddress = accounts[0];
  makerAddress = accounts[1];
  takerAddress = accounts[2];
  randomAddress = accounts[3];

  const minterBridge = await MinterBridge.deployed();
  marketContractProxy = await MarketContractProxy.deployed();
  const collateralToken = await CollateralToken.deployed();
  const paymentToken = await PaymentToken.deployed();

  honeylemonService = new HoneylemonService(
    process.env.SRA_URL,
    process.env.SUBGRAPH_URL,
    web3.currentProvider,
    1337,
    minterBridge.address,
    marketContractProxy.address,
    collateralToken.address,
    paymentToken.address
  );

  // Stub orders
  await stubOrders();

  // Stub subgraph
  await stubSubgraph();

  // Starting MRI value
  mriInput = 0.00001833;
  currentMRIScaled = new BigNumber(mriInput).shiftedBy(8); //1e8
  // expiration time in the future
  let currentContractTime = (await marketContractProxy.getTime.call()).toNumber();
  let contractDuration = (await marketContractProxy.CONTRACT_DURATION()).toNumber();
  let expirationTime = currentContractTime + contractDuration;

  let contractSpecs = await marketContractProxy.generateContractSpecs.call(
    currentMRIScaled,
    expirationTime
  );

  // Create Todays market protocol contract
  await marketContractProxy.dailySettlement(
    0, // lookback index
    currentMRIScaled.toString(), // current index value
    [
      web3.utils.utf8ToHex('MRI-BTC-28D-20200501'),
      web3.utils.utf8ToHex('MRI-BTC-28D-20200501-Long'),
      web3.utils.utf8ToHex('MRI-BTC-28D-20200501-Short')
    ], // new market name
    expirationTime.toString(), // new market expiration
    {
      from: ownerAddress
    }
  );

  currentDayCounter = 0; //increment for diffrent contract deployments for sequential days
  const deployedMarketContract = await marketContractProxy.getLatestMarketContract();
  const marketContract = await MarketContractMPX.at(deployedMarketContract);
  longToken[currentDayCounter] = await PositionToken.at(
    await marketContract.LONG_POSITION_TOKEN()
  );
  shortToken[currentDayCounter] = await PositionToken.at(
    await marketContract.SHORT_POSITION_TOKEN()
  );
});

const stubOrders = async () => {
  const orderParams = [
    {
      sizeTh: new BigNumber(1000),
      pricePerTh: new BigNumber(3.6)
    },
    {
      sizeTh: new BigNumber(1200),
      pricePerTh: new BigNumber(3.7)
    },
    {
      sizeTh: new BigNumber(3600),
      pricePerTh: new BigNumber(3.9)
    }
  ];
  const expirationTime = new BigNumber(
    Math.round(Date.now() / 1000) + 365 * 24 * 60 * 60
  ); // 1 year
  const orders = orderParams.map(p =>
    honeylemonService.createOrder(makerAddress, p.sizeTh, p.pricePerTh, expirationTime)
  );
  const signedOrders = await Promise.all(orders.map(o => honeylemonService.signOrder(o)));

  const records = signedOrders.map(o => ({
    order: o,
    metaData: {
      orderHash: orderHashUtils.getOrderHash(o),
      remainingFillableTakerAssetAmount: o.takerAssetAmount
    }
  }));
  sinon.stub(honeylemonService.apiClient, 'getOrderbookAsync').returns({
    bids: {
      total: 0,
      page: 1,
      perPage: 20,
      records: []
    },
    asks: {
      total: 3,
      page: 1,
      perPage: 20,
      records
    }
  });
  sinon.stub(honeylemonService.apiClient, 'getOrdersAsync').returns({
    total: 3,
    page: 1,
    perPage: 20,
    records
  });
}

const createContract = (marketId, qtyToMint) => {
  return {
    "contractName": "MRI-BTC-28D-20200501",
    "createdAt": "85",
    "id": "0-0x83de191d42df02849c3fa4d1b05428a96dc005c7a53673a8dff9fb6140207820-16",
    "latestMarketContract": "0x173be3b7f6a7f5db49dc90fb47c5a3c08ae3026f",
    "longTokenAddress": "0x01606f7913b0417e4e81fe84589371216faa9e95",
    "longTokenDSProxy": "0xe36ea790bc9d7ab70c55260c66d52b1eca985f84",
    "longTokenRecipient": {
      "id": "0xe36ea790bc9d7ab70c55260c66d52b1eca985f84"
    },
    "marketId": marketId,
    "qtyToMint": qtyToMint,
    "shortTokenAddress": "0x57ff2298fea9066efff1505f14b4b0bdad5c8342",
    "shortTokenDSProxy": "0x6ecbe1db9ef729cbe972c83fb886247691fb6beb",
    "shortTokenRecipient": {
      "id": "0x6ecbe1db9ef729cbe972c83fb886247691fb6beb"
    },
    "time": "1590014756",
    "transaction": {
      "blockNumber": "85",
      "fills": [
        {
          "makerAssetFilledAmount": "54",
          "takerAssetFilledAmount": "9990000"
        }
      ]
    }
  };
}

const stubSubgraph = async () => {
  const subgraphStub = sinon.stub(honeylemonService.subgraphClient, 'request');
  // as maker
  subgraphStub
    .withArgs(CONTRACTS_QUERY, sinon.match({ address: makerAddress.toLowerCase() }))
    .returns({
      user: {
        contractsAsMaker: [
          createContract("0", "1"),
          createContract("0", "2"),
          createContract("0", "3"),
          createContract("1", "2")
        ],
        contractsAsTaker: []
      }
    });

  // as taker
  subgraphStub
    .withArgs(CONTRACTS_QUERY, sinon.match({ address: takerAddress.toLowerCase() }))
    .returns({
      user: {
        contractsAsMaker: [],
        contractsAsTaker: [
          createContract("0", "1"),
          createContract("0", "2"),
          createContract("0", "3"),
          createContract("1", "2")
        ]
      }
    });
}

contract('HoneylemonService', () => {
  it('should give correct quote for size', async () => {
    const {
      price,
      resultOrders,
      ordersRemainingFillableMakerAssetAmounts,
      makerAssetFillAmounts,
      takerAssetFillAmounts,
      remainingMakerFillAmount,
      totalMakerFillAmount,
      totalTakerFillAmount
    } = await honeylemonService.getQuoteForSize(new BigNumber(1600));

    expect(price).to.eql(new BigNumber(3.6375));
    expect(makerAssetFillAmounts).to.eql([new BigNumber(1000), new BigNumber(600)]);
    expect(takerAssetFillAmounts).to.eql([
      new BigNumber(3600).shiftedBy(PAYMENT_TOKEN_DECIMALS),
      new BigNumber(2220).shiftedBy(PAYMENT_TOKEN_DECIMALS)
    ]);
    expect(totalMakerFillAmount).to.eql(new BigNumber(1600));
    expect(totalTakerFillAmount).to.eql(
      new BigNumber(5820).shiftedBy(PAYMENT_TOKEN_DECIMALS)
    );
    expect(remainingMakerFillAmount).to.eql(new BigNumber(0));
  });

  it('should give correct quote for budget', async () => {
    const {
      price,
      resultOrders,
      ordersRemainingFillableMakerAssetAmounts,
      makerAssetFillAmounts,
      takerAssetFillAmounts,
      remainingTakerFillAmount,
      totalMakerFillAmount,
      totalTakerFillAmount
    } = await honeylemonService.getQuoteForBudget(new BigNumber(10000));

    expect(price.sd(5)).to.eql(new BigNumber('3.7001'));
    expect(makerAssetFillAmounts).to.eql([
      new BigNumber(1000),
      new BigNumber(1200),
      new BigNumber(502)
    ]);
    expect(takerAssetFillAmounts).to.eql([
      new BigNumber(3600).shiftedBy(PAYMENT_TOKEN_DECIMALS),
      new BigNumber(4440).shiftedBy(PAYMENT_TOKEN_DECIMALS),
      new BigNumber(1957.8).shiftedBy(PAYMENT_TOKEN_DECIMALS)
    ]);
    expect(totalMakerFillAmount).to.eql(new BigNumber(2702));
    expect(totalTakerFillAmount).to.eql(
      new BigNumber(9997.8).shiftedBy(PAYMENT_TOKEN_DECIMALS)
    );
    expect(remainingTakerFillAmount).to.eql(new BigNumber(0));
  });

  it('should create and sign order', async () => {
    const sizeTh = new BigNumber(2),
      pricePerTh = new BigNumber(100);
    const order = honeylemonService.createOrder(makerAddress, sizeTh, pricePerTh);
    const signedOrder = await honeylemonService.signOrder(order);

    expect(signedOrder.makerAssetAmount).to.eql(sizeTh);
    expect(signedOrder.takerAssetAmount).to.eql(
      sizeTh.multipliedBy(pricePerTh).shiftedBy(6)
    );
    expect(signedOrder.signature).to.not.be.empty;
  });

  it('should report correct collateral token amounts', async () => {
    // First approve
    await honeylemonService.approveCollateralToken(makerAddress);

    const { balance, allowance } = await honeylemonService.getCollateralTokenAmounts(
      makerAddress
    );
    expect(allowance).to.eql(
      new BigNumber(
        '115792089237316195423570985008687907853269984665640564039457584007913129639935'
      )
    );
  });

  it('should report correct payment token amounts', async () => {
    // First approve
    await honeylemonService.approvePaymentToken(takerAddress);

    const { balance, allowance } = await honeylemonService.getPaymentTokenAmounts(
      takerAddress
    );
    expect(allowance).to.eql(
      new BigNumber(
        '115792089237316195423570985008687907853269984665640564039457584007913129639935'
      )
    );
  });

  it.skip('should submit order', async () => {
    const sizeTh = new BigNumber(2),
      pricePerTh = new BigNumber(100);
    const order = honeylemonService.createOrder(makerAddress, sizeTh, pricePerTh);
    const signedOrder = await honeylemonService.signOrder(order);
    console.log('signedOrder', JSON.stringify(signedOrder, 4));
    const result = await honeylemonService.submitOrder(signedOrder);
  });

  it('estimates 0x fees', async () => {
    const protocolFee = await honeylemonService.get0xFeeForOrderBatch(10e9, 2);
    expect(protocolFee).to.eql(new BigNumber(2 * 150000 * 10e9));
  });

  it('gets fill orders gas estimate', async () => {
    const {
      resultOrders,
      takerAssetFillAmounts
    } = await honeylemonService.getQuoteForSize(new BigNumber(1));

    await honeylemonService.approveCollateralToken(makerAddress);
    await honeylemonService.approvePaymentToken(takerAddress);

    const gas = await honeylemonService.estimateGas(
      resultOrders,
      takerAssetFillAmounts,
      takerAddress
    );
    expect(gas).to.be.within(500000, 600000);
  });

  it('fills orders', async () => {
    const fillSize = new BigNumber(1);
    const {
      resultOrders,
      takerAssetFillAmounts
    } = await honeylemonService.getQuoteForSize(fillSize);

    await honeylemonService.approveCollateralToken(makerAddress);
    await honeylemonService.approvePaymentToken(takerAddress);

    const gasPrice = 5e9; // 5 GWEI

    const tx = await honeylemonService.getFillOrdersTx(
      resultOrders,
      takerAssetFillAmounts
    );
    const value = await honeylemonService.get0xFeeForOrderBatch(
      gasPrice,
      resultOrders.length
    );
    const gas = await honeylemonService.estimateGas(
      resultOrders,
      takerAssetFillAmounts,
      takerAddress
    );
    const txHash = await tx.sendTransactionAsync({
      from: takerAddress,
      gas,
      gasPrice,
      value
    });

    expect(txHash).to.not.be.null;

    // Check position token balances
    const longBalance = await longToken[currentDayCounter].balanceOf(takerAddress);
    const shortBalance = await shortToken[currentDayCounter].balanceOf(makerAddress);
    expect(longBalance.toString()).to.eql(fillSize.toString());
    expect(shortBalance.toString()).to.eql(fillSize.toString());
  });

  it('cancels order', async () => {
    const { asks } = await honeylemonService.getOrderbook();
    const orders = asks.records.map(r => r.order);
    const txHash = await honeylemonService
      .getCancelOrderTx(orders[2])
      .sendTransactionAsync({
        from: makerAddress,
        gas: 1500000
      });

    expect(txHash).to.not.be.null;
  });
  it('Calculate required Collateral', async () => {
    const amount = new BigNumber(1000);
    // Expected collateral requirement is defined by the CFD cap price (found by the currentMRI),
    // the contract duration and the collateral requirement %. This defines the market protocol's
    // COLLATERAL_PER_UNIT value.
    const expectedCollateralRequirement = amount
      .multipliedBy(currentMRIScaled)
      .multipliedBy(new BigNumber(28))
      .multipliedBy(new BigNumber(1.35));

    const actualCollateralRequirement = await honeylemonService.calculateRequiredCollateral(
      amount.toString()
    );

    const absoluteDriftErrorNumerator = new BigNumber(actualCollateralRequirement).minus(
      new BigNumber(expectedCollateralRequirement)
    );
    const absoluteDriftError = absoluteDriftErrorNumerator
      .dividedBy(new BigNumber(expectedCollateralRequirement))
      .multipliedBy(new BigNumber(100))
      .absoluteValue();

    // Due to the rounding in the contracts as a result of the number of decimal points of precision
    // there is a small amount of error introduced. This check ensures that the rounding is less than
    // 0.001% as an absolute error. This amounts to about 577.3 satoshi per bitcoin traded on the platform.
    assert.equal(absoluteDriftError.lt(new BigNumber(0.001)), true);
  });

  it.only('Retrieve open contracts', async () => {
    const { result: snapshotId } = await takeSnapshot();

    // Create positions for long and short token holder
    const fillSize = new BigNumber(1);

    // Create two contracts. taker participates as a taker in both. Maker is only involved
    // in the first contract.
    await fill0xOrderForAddresses(1, takerAddress, makerAddress);
    // await time.increase(10); // increase by 10 seconds to signify 1 day
    await fill0xOrderForAddresses(2, takerAddress, makerAddress);
    // await time.increase(10); // increase by 10 seconds to signify 1 day
    await fill0xOrderForAddresses(3, takerAddress, makerAddress);

    // fast forward 28 days
    await time.increase(28 * 24 * 60 * 60 + 1);
    // we need to deploy 28 times in order to be able to settle
    await Promise.all(Array.from({ length: 28 }, (x, i) => {
      return createNewMarketProtocolContract(mriInput * 28, mriInput, 'MRI-BTC-28D-20200502');
    }));

    await fill0xOrderForAddresses(2, takerAddress, makerAddress);

    // Get contracts object from HoneyLemonService
    const { longContracts, shortContracts } = await honeylemonService.getContracts(
      takerAddress
    );

    const { longContracts: longContracts2, shortContracts: shortContracts2 } = await honeylemonService.getContracts(
      makerAddress
    );

    console.log(`Reverting to snapshot ${snapshotId}`);
    await revertToSnapShot(snapshotId);
  });

  it('retrieve open orders', async () => {
    const ordersResponse = await honeylemonService.getOpenOrders(makerAddress);
    const record = ordersResponse.records[0];
    expect(record.metaData.price).to.eql(new BigNumber(3.6));
    expect(record.metaData.remainingFillableMakerAssetAmount).to.eql(new BigNumber(1000));
  });
});
async function fill0xOrderForAddresses(size, taker, maker) {
  const fillSize = new BigNumber(size);
  const longBalanceBefore = await longToken[currentDayCounter].balanceOf(taker);
  const shortBalanceBefore = await shortToken[currentDayCounter].balanceOf(maker);

  const { resultOrders, takerAssetFillAmounts } = await honeylemonService.getQuoteForSize(
    fillSize
  );
  await honeylemonService.approveCollateralToken(maker);
  await honeylemonService.approvePaymentToken(taker);
  const gasPrice = 5e9; // 5 GWEI
  const tx = await honeylemonService.getFillOrdersTx(resultOrders, takerAssetFillAmounts);
  const value = await honeylemonService.get0xFeeForOrderBatch(
    gasPrice,
    resultOrders.length
  );
  const gas = await honeylemonService.estimateGas(
    resultOrders,
    takerAssetFillAmounts,
    taker
  );
  const txHash = await tx.sendTransactionAsync({
    from: taker,
    gas,
    gasPrice,
    value
  });
  expect(txHash).to.not.be.null;
  // Check position token balances
  const longBalanceAfter = await longToken[currentDayCounter].balanceOf(taker);
  assert.equal(longBalanceAfter.toNumber() - longBalanceBefore.toNumber(), fillSize);

  const shortBalanceAfter = await shortToken[currentDayCounter].balanceOf(maker);

  assert.equal(shortBalanceAfter.toNumber() - shortBalanceBefore.toNumber(), fillSize);
}

async function createNewMarketProtocolContract(lookbackIndex, mriInput, marketName) {
  let currentContractTime = (await marketContractProxy.getTime.call()).toNumber();
  let contractDuration = (await marketContractProxy.CONTRACT_DURATION()).toNumber();
  let expirationTime = currentContractTime + contractDuration;

  const currentMRIScaled = new BigNumber(mriInput).shiftedBy(8); //1e8
  const lookbackScaled = new BigNumber(lookbackIndex).shiftedBy(8); //1e8
  await marketContractProxy.dailySettlement(
    lookbackScaled.toString(),
    currentMRIScaled.toString(), // current index value
    [
      web3.utils.utf8ToHex(marketName),
      web3.utils.utf8ToHex(marketName + '-Long'),
      web3.utils.utf8ToHex(marketName + '-Short')
    ], // new market name
    expirationTime.toString(), // new market expiration
    {
      from: ownerAddress
    }
  );

  currentDayCounter = +1; //increment for different contract deployments for sequential days
  const deployedMarketContract = await marketContractProxy.getLatestMarketContract();
  const marketContract = await MarketContractMPX.at(deployedMarketContract);
  longToken[currentDayCounter] = await PositionToken.at(
    await marketContract.LONG_POSITION_TOKEN()
  );
  shortToken[currentDayCounter] = await PositionToken.at(
    await marketContract.SHORT_POSITION_TOKEN()
  );
}
