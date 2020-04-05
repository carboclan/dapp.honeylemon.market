const MinterBridge = artifacts.require('./honeylemon/MinterBridge.sol');
const MarketContractProxy = artifacts.require('./honeylemon/MarketContractProxy.sol');

const MarketContractRegistry = artifacts.require('./marketprotocol/MarketContractRegistry.sol');
const CollateralToken = artifacts.require('./marketprotocol/tokens/CollateralToken.sol');
const MarketContractFactoryMPX = artifacts.require('./marketprotocol/mpx/MarketContractFactoryMPX.sol');

module.exports = async function(deployer, network, accounts) {
  let registry = await MarketContractRegistry.deployed();
  let minterBridge = await MinterBridge.deployed();
  let collateralToken = await CollateralToken.deployed();
  let marketContractFactoryMPX = await MarketContractFactoryMPX.deploy();

  let marketContractAddresss = await registry.addressWhiteList.call(0);
  console.log('marketContractAddresss:', marketContractAddresss);
  if (!marketContractAddresss) {
    throw Error('Unable to get MarketContract address');
  }

  let marketContractProxy = await deployer.deploy(
    MarketContractProxy,
    marketContractFactoryMPX.address,
    accounts[0],
    minterBridge.address,
    collateralToken.address
  );

  console.log(marketContractProxy.address);
};
