// This script simulates one life cycle with honey lemon + market protocol + 0x.
// This is used to validate the interconnection of the layers and to check payouts
// of tokens are what are expected.

const { PayoutCalculator } = require('./payout-calculator');

//Ox libs and tools
const { RPCSubprovider, Web3ProviderEngine } = require('@0x/subproviders');
const {
  generatePseudoRandomSalt,
  Order,
  orderHashUtils,
  signatureUtils,
  SignedOrder,
  assetDataUtils
} = require('@0x/order-utils');
const { ContractWrappers } = require('@0x/contract-wrappers');
const { Web3Wrapper } = require('@0x/web3-wrapper');
const { BigNumber } = require('@0x/utils');

// Helpers
const {
  BN,
  constants,
  expectEvent,
  expectRevert,
  ether,
  time
} = require('@openzeppelin/test-helpers');
const assert = require('assert').strict;
const truffleAssert = require('truffle-assertions');

// Data store with historic MRI values
const pc = new PayoutCalculator();

// Token mocks
const CollateralToken = artifacts.require('CollateralToken'); // IMBTC
const PaymentToken = artifacts.require('PaymentToken'); // USDC
const PositionToken = artifacts.require('PositionToken'); // To create the Long & Short tokens

// Honey Lemon contracts
const MinterBridge = artifacts.require('MinterBridge');
const MarketContractProxy = artifacts.require('MarketContractProxy');

// Market Protocol contracts
// const MarketContract = artifacts.require('MarketContract');
const MarketContractMPX = artifacts.require('marketContractMPX');
const MarketCollateralPool = artifacts.require('MarketCollateralPool');

// Calculation constants
const necessaryCollateralRatio = 0.35; // for 135% collateralization
const multiplier = 28; // contract duration in days
const collateralDecimals = 1e8; // scaling for imBTC (8 decimal points)
const paymentDecimals = 1e6; // scaling for USDT or USDC (6 decimals)

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

async function runExport() {
  let balanceTracker = {};
  async function recordBalances(timeLabel) {
    balanceTracker[timeLabel] = {};
    balanceTracker[timeLabel]['Maker imBTC'] = (await collateralToken.balanceOf(
      makerAddress
    )).toNumber();
    balanceTracker[timeLabel]['Maker USDC'] = (await paymentToken.balanceOf(
      makerAddress
    )).toNumber();
    balanceTracker[timeLabel]['Maker Long'] = (await longToken.balanceOf(
      makerAddress
    )).toNumber();
    balanceTracker[timeLabel]['Maker Short'] = (await shortToken.balanceOf(
      makerAddress
    )).toNumber();
    balanceTracker[timeLabel]['Taker imBTC'] = (await collateralToken.balanceOf(
      takerAddress
    )).toNumber();
    balanceTracker[timeLabel]['Taker USDC'] = (await paymentToken.balanceOf(
      takerAddress
    )).toNumber();
    balanceTracker[timeLabel]['Taker Long'] = (await longToken.balanceOf(
      takerAddress
    )).toNumber();
    balanceTracker[timeLabel]['Taker Short'] = (await shortToken.balanceOf(
      takerAddress
    )).toNumber();
  }

  assert.equal(true, true);

  // params to init 0x setup
  const provider = web3.currentProvider;

  // Then use the provider
  const chainId = 1337;
  const contractWrappers = new ContractWrappers(provider, { chainId });
  const web3Wrapper = new Web3Wrapper(provider);

  const collateralToken = await CollateralToken.deployed();
  const paymentToken = await PaymentToken.deployed();

  const minterBridge = await MinterBridge.deployed();
  const marketContractProxy = await MarketContractProxy.deployed();

  const addresses = await web3Wrapper.getAvailableAddressesAsync();

  // Used accounts
  const honeyLemonOracle = addresses[0]; // Deployed all contracts. Has permission to push prices
  const makerAddress = addresses[1]; // Miner
  const takerAddress = addresses[2]; // Investor

  /********************************************
   * Honey Lemon oracle deploy daily contract *
   ********************************************/
  console.log('0. Setting up proxy and deploying daily contract...');

  // start at day 0. From data set 2019-12-01
  let dayCounter = 0;

  // Starting MRI value
  // const MRIInput = new BigNumber(pc.getMRIDataForDay(dayCounter).toString());
  const MRIInput = 0.00001; // nice input number to calculate expected payoffs.
  const currentMRIScaled = new BigNumber(MRIInput).multipliedBy(
    new BigNumber('100000000')
  ); //1e8
  console.log('\t-> Starting MRI value', MRIInput);
  console.log('\t * Representing 1 TH payout for 1 day, Denominated in BTC');
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
    expirationTime.toString() // new market expiration
  );

  /***************************************************
   * Market contracts created from Honey Lemon proxy *
   ***************************************************/

  // Get the address of todays marketProtocolContract
  const deployedMarketContract = await marketContractProxy.getLatestMarketContract();
  console.log('1. Deployed market contracts @', deployedMarketContract);
  const marketContract = await MarketContractMPX.at(deployedMarketContract);

  const deployedMarketContractPool = await marketContractProxy.getLatestMarketCollateralPool();
  const marketContractPool = await MarketCollateralPool.at(deployedMarketContractPool);

  const longToken = await PositionToken.at(await marketContract.LONG_POSITION_TOKEN());
  console.log(
    'Long token deployed!\t Name:',
    await longToken.name.call(),
    '\t& symbol:',
    await longToken.symbol.call()
  );
  const shortToken = await PositionToken.at(await marketContract.SHORT_POSITION_TOKEN());
  console.log(
    'Short token deployed!\t Name:',
    await shortToken.name.call(),
    '\t& symbol:',
    await shortToken.symbol.call()
  );
  /*********************
   * Generate 0x order *
   *********************/
  console.log('2. Generating 0x order...');

  // Taker token is imBTC sent to collateralize the contractWe use CollateralToken.
  // This is imBTC sent from the investor to the Market protocol contract
  const takerToken = { address: paymentToken.address, decimals: 18 };

  // 0x sees the marketContractProxy as the maker token. This has a `balanceOf` method to get 0x
  // to think the order has processed.
  const makerToken = { address: marketContractProxy.address };

  // Encode the selected makerToken as assetData for 0x
  const makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
    makerToken.address,
    minterBridge.address,
    '0x0000'
  );

  // Encode the selected takerToken as assetData for 0x
  const takerAssetData = await contractWrappers.devUtils
    .encodeERC20AssetData(takerToken.address)
    .callAsync();

  // Amounts are in Unit amounts, 0x requires base units (as many tokens use decimals)
  const makerAmountToMint = 1; // TH of mining over a 1 month duration sold by the miner.
  const takerAmountToMint = 1; // USDC being sent from investor to miner.

  console.table({
    'Maker trade amount(USDC)': {
      Amount: makerAmountToMint,
      Description: 'Number of TH sold over the day duration'
    },
    'Taker trade (USDC)': {
      Amount: takerAmountToMint,
      Description: 'Value in µUSDC sent to buy mining contract'
    },
    'Current MRI': {
      Amount: MRIInput,
      Description: 'Starting MRI input value'
    },
    'Max MRI': {
      Amount: (MRIInput * (1 + necessaryCollateralRatio)).toFixed(8),
      Description: 'Maximum MRI value that can be achieved in market'
    },
    'Taker expected long(imBTC)': {
      Amount: (MRIInput * 28 * makerAmountToMint).toFixed(8),
      Description: 'Long value in BTC if current MRI continues over contract duration'
    },
    'Maker required collateral(imBTC)': {
      Amount: contractSpecs[1].toNumber() * makerAmountToMint,
      Description: 'Satoshi the position will cost in collateral for the miner'
    }
  });
  const makerAssetAmount = Web3Wrapper.toBaseUnitAmount(
    new BigNumber(makerAmountToMint),
    0
  );
  const takerAssetAmount = Web3Wrapper.toBaseUnitAmount(
    new BigNumber(takerAmountToMint),
    0
  );
  console.log('takerAssetAmount', takerAssetAmount);
  const exchangeAddress = contractWrappers.exchange.address;

  // Approve the contract wrapper from 0x to pull USDC from the taker(investor)
  await paymentToken.approve(
    contractWrappers.contractAddresses.erc20Proxy,
    new BigNumber(10).pow(256).minus(1),
    {
      from: takerAddress
    }
  );

  // Approve the contract wrapper from 0x to pull imBTC from the maker(miner)
  await collateralToken.approve(
    minterBridge.address,
    new BigNumber(10).pow(256).minus(1),
    {
      from: makerAddress
    }
  );

  // Generate the 0x order
  const order = {
    makerAddress, // maker is the first address (miner)
    takerAddress: NULL_ADDRESS, // taker is open and can be filled by anyone (when an investor comes along)
    makerAssetAmount, // The maker asset amount
    takerAssetAmount, // The taker asset amount
    expirationTimeSeconds: new BigNumber(expirationTime), // Time when this order expires
    makerFee: 0, // 0 maker fees
    takerFee: 0, // 0 taker fees
    feeRecipientAddress: NULL_ADDRESS, // No fee recipient
    senderAddress: NULL_ADDRESS, // Sender address is open and can be submitted by anyone
    salt: generatePseudoRandomSalt(), // Random value to provide uniqueness
    makerAssetData,
    takerAssetData,
    exchangeAddress,
    makerFeeAssetData: '0x',
    takerFeeAssetData: '0x',
    chainId
  };

  console.log('3. signing 0x order...');

  // Generate the order hash and sign it
  const signedOrder = await signatureUtils.ecSignOrderAsync(
    provider,
    order,
    makerAddress
  );

  await recordBalances('Before 0x order');

  /*****************
   * Fill 0x order *
   *****************/

  console.log('4. Filling 0x order...');

  const debug = false;
  if (debug) {
    // Call MinterBridge directly for debugging
    await minterBridge.bridgeTransferFrom(
      makerToken.address,
      makerAddress,
      takerAddress,
      1,
      '0x0000',
      {
        from: takerAddress,
        gas: 6700000
      }
    );
  } else {
    const txHash = await contractWrappers.exchange
      // .fillOrder(signedOrder, takerAssetAmount, signedOrder.signature)
      .fillOrder(signedOrder, makerAssetAmount, signedOrder.signature)
      .sendTransactionAsync({
        from: takerAddress,
        gas: 6700000,
        value: 3000000000000000
      }); // value is required to pay 0x fees
    console.log('txHash:', txHash);
  }

  await recordBalances('After 0x order');

  /**************************************************
   * Advance time and settle market protocol oracle *
   **************************************************/

  await time.increase(contractDuration);
  dayCounter = 28;

  // const lookedBackMRI = new BigNumber(pc.getMRILookBackDataForDay(dayCounter).toString());
  const lookedBackMRI = MRIInput * 1.1 * 28; // input MRI, increased by 10%, over 28 days
  const lookedBackMRIScaled = new BigNumber(lookedBackMRI).multipliedBy(
    new BigNumber('100000000')
  ); //1e8

  await marketContractProxy.settleMarketContract(
    lookedBackMRIScaled.toFixed(0).toString(),
    marketContract.address,
    {
      from: honeyLemonOracle
    }
  );

  /**********************************************
   * Redeem long and short tokens against market *
   ***********************************************/
  console.log('5. redeeming tokens...');

  await longToken.approve(marketContract.address, takerAmountToMint, {
    from: takerAddress
  });
  await shortToken.approve(marketContract.address, makerAmountToMint, {
    from: makerAddress
  });

  await marketContractPool.settleAndClose(marketContract.address, makerAmountToMint, 0, {
    from: takerAddress
  });
  await marketContractPool.settleAndClose(marketContract.address, 0, makerAmountToMint, {
    from: makerAddress
  });

  await recordBalances('After redemption');
  console.log('token value changes');
  console.table(balanceTracker);

  console.log('6. Validating token balance transfers...');
  console.log('6.1 Correct imBTC collateral from maker👇');
  // Upper Bound = Miner Revenue Index * (1 + Necessary Collateral Ratio)
  // Necessary Collateral = Upper Bound * Multiplier
  const upperBound = MRIInput * (1 + necessaryCollateralRatio); //1 + 0.35
  const necessaryCollateralPerMRI = upperBound * multiplier * collateralDecimals; // upper bound over contract duration
  const expectedCollateralTaken = necessaryCollateralPerMRI * makerAmountToMint;

  const actualCollateralTaken = // Difference in imBTC balance before and after 0x order
    balanceTracker['Before 0x order']['Maker imBTC'] -
    balanceTracker['After 0x order']['Maker imBTC'];

  console.log('\t -> imBTC Collateral Taken (Satoshi)', actualCollateralTaken);

  assert.equal(actualCollateralTaken, expectedCollateralTaken);

  console.log('6.2 Correct USDC sent from taker👇');
  const expectedUSDCTaken = takerAmountToMint * paymentDecimals;
  const actualUSDCTaken =
    balanceTracker['Before 0x order']['Taker USDC'] -
    balanceTracker['After 0x order']['Taker USDC'];
  // assert.equal(expectedUSDCTaken, actualUSDCTaken);

  /***********************************************************
   * Validate Contract payouts from recorded balance changes *
   ***********************************************************/

  /*************************************************
   * Life cycle loop test over a number of markets *
   *************************************************/
  // expiration time in the future
  // currentContractTime = (await marketContractProxy.getTime.call()).toNumber();
  // contractDuration = (await marketContractProxy.CONTRACT_DURATION()).toNumber();
  // expirationTime = currentContractTime + contractDuration;

  // deploy a new market contract

  // await marketContractProxy.dailySettlement(
  //   '0',
  //   '1200',
  //   '2020-02-02',
  //   expirationTime.toString()
  // );
}

run = async function(callback) {
  try {
    await runExport();
  } catch (err) {
    console.error(err);
  }
  callback();
};
// Attach this function to the exported function
// in order to allow the script to be executed through both truffle and a test runner.
run.runExport = runExport;
module.exports = run;
