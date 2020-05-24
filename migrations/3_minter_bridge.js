const MinterBridge = artifacts.require('MinterBridge');
const { getContractAddressesForChainOrThrow } = require('@0x/contract-addresses');

async function getErc20BridgeProxyAddress() {
  const chainId = await web3.eth.net.getId();
  return getContractAddressesForChainOrThrow(chainId).erc20BridgeProxy;
}

module.exports = async function(deployer, network, accounts) {
  if (network == "skip-migrations") return;

  await deployer.deploy(MinterBridge);
  const minterBridge = await MinterBridge.deployed();
  const erc20BridgeProxyAddress = await getErc20BridgeProxyAddress();
  await minterBridge.set0xBridgeProxy(erc20BridgeProxyAddress, { from: accounts[0] });
  console.log('🤑 Done Minter Bridge Migration!');
};
