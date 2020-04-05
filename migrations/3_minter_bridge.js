const MinterBridge = artifacts.require('MinterBridge');
const FakeToken = artifacts.require('FakeToken');

const MarketContractRegistry = artifacts.require('MarketContractRegistry');
const CollateralToken = artifacts.require('CollateralToken');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(MinterBridge);

  // let bridge = await MinterBridge.deployed();

  // give some collateral tokens to the buyer
  // const collateralToken = await CollateralToken.deployed();
  // await collateralToken.transfer(accounts[0], "2000000000000");

  // // Allow MinterBridge to draw the collateral
  // await collateralToken.approve(bridge.address, "2000000000000", { from: accounts[0] });

  console.log('🤑Done Minter Bridge Migration!');
};
