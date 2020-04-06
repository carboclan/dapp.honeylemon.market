const MinterBridge = artifacts.require('MinterBridge');
const FakeToken = artifacts.require('FakeToken');

const MarketContractRegistry = artifacts.require('MarketContractRegistry');
const CollateralToken = artifacts.require('CollateralToken');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(MinterBridge);
  console.log('🤑Done Minter Bridge Migration!@');
};
