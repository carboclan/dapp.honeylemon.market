const MinterBridge = artifacts.require('MinterBridge');
const MarketContractProxy = artifacts.require('MarketContractProxy');

const MarketContractRegistry = artifacts.require('MarketContractRegistry');
const CollateralToken = artifacts.require('CollateralToken');
const MarketContractFactoryMPX = artifacts.require('MarketContractFactoryMPX');

module.exports = async function(deployer, network, accounts) {
  if (network == "skip-migrations") return;

  // Deploy imBTC token
  await deployer.deploy(CollateralToken, 'Mock imBTC', 'imBTC', 1000000000000000, 8);

  // Give some collateral token to miner
  const collateralToken = await CollateralToken.deployed();
  collateralToken.transfer(accounts[1], 1000000000000000);

  console.log('🕺 Deployed Mock Collateral token');

  let registry = await MarketContractRegistry.deployed();
  let minterBridge = await MinterBridge.deployed();
  let marketContractFactoryMPX = await MarketContractFactoryMPX.deployed();

  // Deploy the Market Contract proxy
  let marketContractProxy = await deployer.deploy(
    MarketContractProxy,
    marketContractFactoryMPX.address,
    accounts[0],
    minterBridge.address,
    collateralToken.address
  );

  console.log('👉 Deployed Market Contract Proxy');

  // Transfer all appropriate rights from the deployed market protocol to marketContractProxy:
  // Point the 0x MinterBridge to the marketContractProxy
  await minterBridge.setMarketContractProxyAddress(marketContractProxy.address);

  // Ability for proxy to mint tokens for each market
  await registry.addAddressToWhiteList(marketContractProxy.address);

  // Ability for proxy to push prices
  await marketContractFactoryMPX.setOracleHubAddress(marketContractProxy.address);

  // Ability for proxy to deploy new market protocol contracts
  await marketContractFactoryMPX.transferOwnership(marketContractProxy.address);

  console.log('🙇‍♂️ Transferred permissions to proxy');
};
