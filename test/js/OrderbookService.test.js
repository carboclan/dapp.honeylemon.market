const { BigNumber } = require('@0x/utils');
const { Web3Wrapper } = require('@0x/web3-wrapper');
const { assetDataUtils } = require('@0x/order-utils');

const MinterBridge = artifacts.require('MinterBridge');
const MarketContractProxy = artifacts.require('MarketContractProxy');
const CollateralToken = artifacts.require('CollateralToken'); // IMBTC
const PaymentToken = artifacts.require('PaymentToken'); // USDC

const OrderbookService = require('../../src/lib/OrderbookService');

const web3Wrapper = new Web3Wrapper(web3.currentProvider);
let accounts = null,
  makerAddress = null,
  takerAddress = null;
let orderbookService = null;

before(async function() {
  accounts = await web3Wrapper.getAvailableAddressesAsync();
  makerAddress = accounts[0];
  takerAddress = accounts[1];

  const minterBridge = await MinterBridge.deployed();
  const marketContractProxy = await MarketContractProxy.deployed();
  const collateralToken = await CollateralToken.deployed();
  const paymentToken = await PaymentToken.deployed();

  orderbookService = new OrderbookService(
    process.env.SRA_URL,
    minterBridge.address,
    marketContractProxy.address,
    collateralToken.address,
    paymentToken.address,
    web3.currentProvider,
    await web3.eth.net.getId()
  );
});

describe('OrderbookService', () => {
  it('should give correct quote', async () => {
    const {
      price,
      resultOrders,
      ordersRemainingFillableMakerAssetAmounts,
      remainingFillAmount
    } = await orderbookService.getQuoteForSize(new BigNumber(2));
    assert.isTrue(price.eq(new BigNumber(0.5)), 'price is not correct');
  });

  it('should create and sign order', async () => {
    const sizeTh = new BigNumber(2),
      pricePerTh = new BigNumber(100);
    const order = orderbookService.createOrder(makerAddress, sizeTh, pricePerTh);
    const signedOrder = await orderbookService.signOrder(order);

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
    await orderbookService.approveCollateralToken(makerAddress);

    const { balance, allowance } = await orderbookService.getCollateralTokenAmounts(
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
    await orderbookService.approvePaymentToken(takerAddress);

    const { balance, allowance } = await orderbookService.getPaymentTokenAmounts(
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
    const order = orderbookService.createOrder(makerAddress, sizeTh, pricePerTh);
    const signedOrder = await orderbookService.signOrder(order);
    const result = await orderbookService.submitOrder(signedOrder);
    console.log(result);
  });
});
