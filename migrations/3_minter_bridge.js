const MinterBridge = artifacts.require('MinterBridge');
const FakeToken = artifacts.require('FakeToken');

const MarketContractRegistry = artifacts.require('MarketContractRegistry');
const CollateralToken = artifacts.require('CollateralToken');

module.exports = async function(deployer, network, accounts) {
  console.log(MinterBridge);
  await deployer.deploy(MinterBridge);

  let bridge = await MinterBridge.deployed();
  // const fakeTokenSupply = '20000000000000000000000';
  // const fakeToken = await deployer.deploy(FakeToken, 'Fake', 'FAK', fakeTokenSupply, 18);
  // await fakeToken.transfer(bridge.address, '10000000000000000000000');
  // await fakeToken.transfer(accounts[0], '10000000000000000000000');

  // give some collateral tokens to the buyer
  const collateralToken = await CollateralToken.deployed();
  await collateralToken.transfer(accounts[1], '1000000000000000000');

  // Allow MinterBridge to draw the collateral
  await collateralToken.approve(bridge.address, '10000000000000000000000', { from: accounts[0] });

  console.log('🤑Done Minter Bridge Migration!');
};
