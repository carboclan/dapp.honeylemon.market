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

const HoneylemonService = require('../../src/lib/HoneylemonService');

const web3Wrapper = new Web3Wrapper(web3.currentProvider);
let accounts = null,
  // addresses
  makerAddress = [null],
  takerAddress = null,
  randomAddress = null,
  // contracts
  honeyLemonOracle = null,
  longToken = [null],
  shortToken = [null],
  marketContractProxy = null,
  // variables
  currentDayCounter = 0,
  mriInput = null,
  // tested service
  honeylemonService = null;

before(async function() {
  accounts = await web3Wrapper.getAvailableAddressesAsync();
  honeyLemonOracle = accounts[0];
  makerAddress = accounts[1];
  takerAddress = accounts[2];
  randomAddress = accounts[3];

  const minterBridge = await MinterBridge.deployed();
  marketContractProxy = await MarketContractProxy.deployed();
  const collateralToken = await CollateralToken.deployed();
  const paymentToken = await PaymentToken.deployed();

  honeylemonService = new HoneylemonService(
    process.env.SRA_URL,
    minterBridge.address,
    marketContractProxy.address,
    collateralToken.address,
    paymentToken.address,
    web3,
    1337,
    marketContractProxy.abi,
    MarketCollateralPool.abi,
    MarketContractMPX.abi
  );

  // Stub orders
  const orderParams = [
    {
      sizeTh: new BigNumber(1000),
      pricePerTh: new BigNumber(360)
    },
    {
      sizeTh: new BigNumber(1200),
      pricePerTh: new BigNumber(370)
    },
    {
      sizeTh: new BigNumber(3600),
      pricePerTh: new BigNumber(390)
    }
  ];
  const orders = orderParams.map(p =>
    honeylemonService.createOrder(makerAddress, p.sizeTh, p.pricePerTh)
  );
  const signedOrders = await Promise.all(orders.map(o => honeylemonService.signOrder(o)));

  const records = signedOrders.map(o => ({
    order: o,
    metaData: {
      orderHash: orderHashUtils.getOrderHash(o),
      remainingFillableTakerAssetAmount: o.takerAssetAmount
    }
  }));
  const stubData = {
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
  };
  const orderbookStub = sinon.stub(honeylemonService, 'getOrderbook').returns(stubData);

  // Starting MRI value
  mriInput = 0.00001833;
  const currentMRIScaled = new BigNumber(mriInput).multipliedBy(
    new BigNumber('100000000')
  ); //1e8
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
      from: honeyLemonOracle
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

describe('HoneylemonService', () => {
  it('should give correct quote for size', async () => {
    const {
      price,
      resultOrders,
      ordersRemainingFillableMakerAssetAmounts,
      takerAssetFillAmounts,
      remainingFillAmount
    } = await honeylemonService.getQuoteForSize(new BigNumber(1600));

    expect(price).to.eql(new BigNumber(363.75));
    expect(takerAssetFillAmounts).to.eql([new BigNumber(360000), new BigNumber(222000)]);
  });

  it('should give correct quote for budget', async () => {
    const {
      price,
      resultOrders,
      ordersRemainingFillableTakerAssetAmounts,
      takerAssetFillAmounts,
      remainingFillAmount
    } = await honeylemonService.getQuoteForBudget(new BigNumber(1000000));

    expect(price.sd(5)).to.eql(new BigNumber('370.1'));
    expect(takerAssetFillAmounts).to.eql([
      new BigNumber(360000),
      new BigNumber(444000),
      new BigNumber(196000)
    ]);
  });

  it('should create and sign order', async () => {
    const sizeTh = new BigNumber(2),
      pricePerTh = new BigNumber(100);
    const order = honeylemonService.createOrder(makerAddress, sizeTh, pricePerTh);
    const signedOrder = await honeylemonService.signOrder(order);

    assert.isTrue(
      signedOrder.makerAssetAmount.eq(sizeTh),
      'makerAssetAmount is not correct'
    );

    assert.isTrue(
      signedOrder.takerAssetAmount.eq(sizeTh.multipliedBy(pricePerTh)),
      'takerAssetAmount is not correct'
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
    const result = await honeylemonService.submitOrder(signedOrder);
    console.log(result);
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
    expect(gas).to.eq(570624);
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
  it('Retrieve open contracts', async () => {
    // Create positions for long and short token holder
    const fillSize = new BigNumber(1);

    // Create two contracts. taker participates as a taker in both. Maker is only involved
    // in the first contract.
    await fill0xOrderForAddresses(1, takerAddress, makerAddress);
    // await time.increase(10); // increase by 10 seconds to signify 1 day
    await fill0xOrderForAddresses(2, takerAddress, makerAddress);
    // await time.increase(10); // increase by 10 seconds to signify 1 day
    await fill0xOrderForAddresses(3, takerAddress, makerAddress);

    await createNewMarketProtocolContract(0, mriInput, 'MRI-BTC-28D-20200502');

    await fill0xOrderForAddresses(2, takerAddress, makerAddress);

    // Get contracts object from HoneyLemonService
    console.log('test');
    const { longContracts, shortContracts } = await honeylemonService.getContracts(
      takerAddress
    );
    console.log('longContracts', longContracts);
    console.log('shortContracts', shortContracts);

    const { longContracts2, shortContracts2 } = await honeylemonService.getContracts(
      makerAddress
    );
    console.log('longContracts2', longContracts2);
    console.log('shortContracts2', shortContracts2);
  });
});
async function fill0xOrderForAddresses(size, taker, maker) {
  const fillSize = new BigNumber(size);
  const longBalanceBefore = await longToken[currentDayCounter].balanceOf(taker);
  const shortBalanceBefore = await shortToken[currentDayCounter].balanceOf(maker);

  console.log('shortBalanceBefore.toNumber()', shortBalanceBefore.toNumber());
  const { resultOrders, takerAssetFillAmounts } = await honeylemonService.getQuoteForSize(
    fillSize
  );
  // console.log('resultOrders', resultOrders);
  // console.log('takerAssetFillAmounts', takerAssetFillAmounts);
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
  console.log('txHash', txHash);
  expect(txHash).to.not.be.null;
  // Check position token balances
  const longBalanceAfter = await longToken[currentDayCounter].balanceOf(taker);
  assert.equal(longBalanceAfter.toNumber() - longBalanceBefore.toNumber(), fillSize);

  const shortBalanceAfter = await shortToken[currentDayCounter].balanceOf(maker);
  console.log('shortBalanceAfter.toString', shortBalanceAfter.toString());

  assert.equal(shortBalanceAfter.toNumber() - shortBalanceBefore.toNumber(), fillSize);
}

async function createNewMarketProtocolContract(lookbackIndex, mriInput, marketName) {
  let currentContractTime = (await marketContractProxy.getTime.call()).toNumber();
  let contractDuration = (await marketContractProxy.CONTRACT_DURATION()).toNumber();
  let expirationTime = currentContractTime + contractDuration;

  const currentMRIScaled = new BigNumber(mriInput).multipliedBy(
    new BigNumber('100000000')
  ); //1e8
  await marketContractProxy.dailySettlement(
    lookbackIndex,
    currentMRIScaled.toString(), // current index value
    [
      web3.utils.utf8ToHex(marketName),
      web3.utils.utf8ToHex(marketName + '-Long'),
      web3.utils.utf8ToHex(marketName + '-Short')
    ], // new market name
    expirationTime.toString(), // new market expiration
    {
      from: honeyLemonOracle
    }
  );

  currentDayCounter = +1; //increment for different contract deployments for sequential days
  console.log(currentDayCounter);
  const deployedMarketContract = await marketContractProxy.getLatestMarketContract();
  const marketContract = await MarketContractMPX.at(deployedMarketContract);
  longToken[currentDayCounter] = await PositionToken.at(
    await marketContract.LONG_POSITION_TOKEN()
  );
  shortToken[currentDayCounter] = await PositionToken.at(
    await marketContract.SHORT_POSITION_TOKEN()
  );
}
