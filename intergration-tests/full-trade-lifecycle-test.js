// The test script simulates a full lifecycle of the Honeylemon ecosystem by
// iteratively deploying and settling 60 days worth of contracts. This is done
// to show that the look back and daily settlement works from the HoneyLemon
// oracle and the associated permissions.

// To run this script start the 0x docker container and then run the script as follows
// $docker run -it -p 8545:8545 0xorg/ganache-cli:latest
// $truffle migrate --reset && truffle exec ./honeylemon-intergration-tests/full-trade-lifecycle-test.js

// Helper libraries
const { PayoutCalculator } = require('./helpers/payout-calculator');

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

// Honey Lemon contracts
const MinterBridge = artifacts.require('MinterBridge');
const MarketContractProxy = artifacts.require('MarketContractProxy');

async function runExport() {
  console.log('🔥🔥🔥STARTING LIFECYCLE SCRIPT🔥🔥🔥');
  let balanceTracker = {};

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

  /*************************************************
   * Life cycle loop test over a number of markets *
   *************************************************/

  console.log('1. Iterative lifecycle test');
  // Create, mint and settle 60 days worth of tokens. Note that this call assumes we start again from zero deployed con
  // of the previous contract
  for (let i = 0; i < 60; i++) {
    // expiration time in the future
    currentContractTime = (await marketContractProxy.getTime.call()).toNumber();
    contractDuration = (await marketContractProxy.CONTRACT_DURATION()).toNumber();
    expirationTime = currentContractTime + contractDuration;

    const scaledMRI = new BigNumber(pc.getMRIDataForDay(i)).multipliedBy(
      new BigNumber('100000000')
    );
    const lookbackScaledMRI = new BigNumber(pc.getMRILookBackDataForDay(i)).multipliedBy(
      new BigNumber('100000000')
    );
    const tokenName = pc.getTokenNameFor(i);

    // deploy a new market contract and settle previous contract
    await marketContractProxy.dailySettlement(
      lookbackScaledMRI,
      scaledMRI,
      [
        web3.utils.utf8ToHex(tokenName),
        web3.utils.utf8ToHex(tokenName + '-Long'),
        web3.utils.utf8ToHex(tokenName + '-short')
      ],
      expirationTime.toString()
    );

    const latestMarketProtocolContract = await marketContractProxy.getLatestMarketContract();
    console.log(
      '\t-> ',
      'tokenName',
      tokenName,
      'scaledMRI',
      scaledMRI,
      'lookbackScaledMRI',
      lookbackScaledMRI
    );

    console.log(
      i,
      '-> MarketContract deployed @',
      latestMarketProtocolContract,
      'Contract name:',
      tokenName
    );

    await time.increase(contractDuration);
  }
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
