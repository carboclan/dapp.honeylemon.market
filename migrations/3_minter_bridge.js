const MinterBridge = artifacts.require('MinterBridge');

module.exports = async function(deployer, network, accounts) {
  await deployer.deploy(MinterBridge);
  console.log('🤑Done Minter Bridge Migration!');
};
