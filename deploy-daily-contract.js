// This script simulates one life cycle with honey lemon + market protocol + 0x.
// This is used to validate the interconnection of the layers and to check payouts
// of tokens are what are expected.

// Helper libraries
const { PayoutCalculator } = require('./payout-calculator');
const HoneylemonService = require('./src/lib/HoneylemonService');

//Ox libs and tools
const {
  generatePseudoRandomSalt,
  signatureUtils,
  assetDataUtils
} = require('@0x/order-utils');
const { ContractWrappers } = require('@0x/contract-wrappers');
const { Web3Wrapper } = require('@0x/web3-wrapper');
const { BigNumber } = require('@0x/utils');

// Helpers
const { time } = require('@openzeppelin/test-helpers');
const assert = require('assert').strict;

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

// simulation inputs
const startingDay = 35; // Start date for day payout-calculator beginning contract date
// Amounts are in Unit amounts, 0x requires base units (as many tokens use decimals)
const makerAmountToMint = 1000; // TH of mining over a 1 month duration sold by the miner.
const takerAmountToMint = 4000 * 1e6; // USDC sent from investor to miner. $4 ~ 1 month of 1TH mining rewards @ btc = 7k

// Config:
const REAL_INPUT = true;

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

async function runExport() {
  console.log('🔥🔥🔥STARTING SINGLE ITERATION SCRIPT🔥🔥🔥');

  // params to init 0x setup
  const provider = web3.currentProvider;

  // Then use the provider
  const chainId = await web3.eth.net.getId();
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

  // Starting MRI value
  let mriInput;
  if (REAL_INPUT) mriInput = pc.getMRIDataForDay(startingDay);
  // get MRI for day 0 in data set
  else mriInput = 0.00001; // nice input number to calculate expected payoffs.
  const currentMRIScaled = new BigNumber(mriInput).multipliedBy(
    new BigNumber('100000000')
  ); //1e8
  console.log('\t-> Starting MRI value', mriInput);
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
  const takerToken = { address: paymentToken.address };

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
  console.table({
    'Maker trade amount(TH)': {
      Amount: makerAmountToMint,
      Description: 'Number of TH sold over the day duration'
    },
    'Taker trade (USDC)': {
      Amount: takerAmountToMint,
      Description: 'Value in µUSDC sent to buy mining contract'
    },
    'Current MRI': {
      Amount: mriInput,
      Description: 'Starting MRI input value'
    },
    'Max MRI': {
      Amount: (mriInput * (1 + necessaryCollateralRatio)).toFixed(8),
      Description: 'Maximum MRI value that can be achieved in market'
    },
    'Taker expected long(imBTC)': {
      Amount: (mriInput * 28 * makerAmountToMint).toFixed(8),
      Description: 'Long value in BTC if current MRI continues over contract duration'
    },
    'Maker required collateral(imBTC)': {
      Amount: contractSpecs[1].toNumber() * makerAmountToMint,
      Description: 'Satoshi the position will cost in collateral for the miner'
    }
  });
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
