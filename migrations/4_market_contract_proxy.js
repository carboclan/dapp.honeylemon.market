const MinterBridge = artifacts.require('MinterBridge');
const MarketContractProxy = artifacts.require('MarketContractProxy');

const MarketContractRegistry = artifacts.require('MarketContractRegistry');
const CollateralToken = artifacts.require('CollateralToken');
const MarketContractFactoryMPX = artifacts.require('MarketContractFactoryMPX');

module.exports = async function(deployer, network, accounts) {
  let registry = await MarketContractRegistry.deployed();
  let minterBridge = await MinterBridge.deployed();
  let collateralToken = await CollateralToken.deployed();
  let marketContractFactoryMPX = await MarketContractFactoryMPX.deployed();

  // Deploy the Market Contract proxy
  let marketContractProxy = await deployer.deploy(
    MarketContractProxy,
    marketContractFactoryMPX.address,
    accounts[0],
    minterBridge.address,
    collateralToken.address
  );

  console.log('👉Deployed Market Contract Proxy');

  // Transfer all appropriate rights from the deployed market protocol to marketContractProxy:
  // Point the 0x MinterBridge to the marketContractProxy
  await minterBridge.setMarketProxyAddress(marketContractProxy.address);

  // Ability for proxy to mint tokens for each market
  await registry.addAddressToWhiteList(marketContractProxy.address);

  // Ability for proxy to push prices
  await marketContractFactoryMPX.setOracleHubAddress(marketContractProxy.address);

  // Ability for proxy to deploy new market protocol contracts
  await marketContractFactoryMPX.transferOwnership(marketContractProxy.address);

  console.log('🙇‍♂️Transferred permissions to proxy');
};
