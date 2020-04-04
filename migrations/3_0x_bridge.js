const MinterBridge = artifacts.require('./honeylemon/MinterBridge.sol');
const FakeToken = artifacts.require('./honeylemon/FakeToken.sol');

const MarketContractRegistry = artifacts.require('./MarketContractRegistry.sol');
const CollateralToken = artifacts.require('./tokens/CollateralToken.sol');

module.exports = async function(deployer, network, accounts) {
  let registry = await MarketContractRegistry.deployed();
  let marketContractAddresss = await registry.addressWhiteList.call(0);
  console.log('marketContractAddresss:', marketContractAddresss);
  if (!marketContractAddresss) {
    throw Error('Unable to get MarketContract address');
  }

  let bridge = await deployer.deploy(MinterBridge, marketContractAddresss);

  const fakeTokenSupply = '20000000000000000000000';
  const fakeToken = await deployer.deploy(FakeToken, 'Fake', 'FAK', fakeTokenSupply, 18);
  await fakeToken.transfer(bridge.address, '10000000000000000000000');
  await fakeToken.transfer(accounts[0], '10000000000000000000000');

  // give some collateral tokens to the buyer
  const collateralToken = await CollateralToken.deployed();
  await collateralToken.transfer(accounts[1], '1000000000000000000');

  // Allow MinterBridge to draw the collateral
  await collateralToken.approve(bridge.address, '10000000000000000000000', {from: accounts[0]})
};
