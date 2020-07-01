const MinterBridge = artifacts.require('MinterBridge');
const MarketContractProxy = artifacts.require('MarketContractProxy');
const MarketCollateralPool = artifacts.require('MarketCollateralPool');
const MarketContractRegistry = artifacts.require('MarketContractRegistry');
const CollateralToken = artifacts.require('CollateralToken');
const MarketContractFactoryMPX = artifacts.require('MarketContractFactoryMPX');

module.exports = async function(deployer, network, accounts) {
  if (network == 'skip-migrations') return;

  //TODO: update migrations to pull the address of this token from the respective network.
  // Deploy imBTC token

  let collateralTokenAddress = process.env.COLLATERAL_TOKEN_ADDRESS;
  if (network != 'mainnet' && network != 'mainnet-fork') {
    await deployer.deploy(CollateralToken, 'Mock imBTC', 'imBTC', 1000000000000000, 8);
    // Give some collateral token to miner
    const collateralToken = await CollateralToken.deployed();
    collateralToken.transfer(accounts[1], 1000000000000000);
    collateralTokenAddress = collateralToken.address;

    console.log('🕺 Deployed Mock Collateral token');
  }

  let registry = await MarketContractRegistry.deployed();
  let minterBridge = await MinterBridge.deployed();
  let marketContractFactoryMPX = await MarketContractFactoryMPX.deployed();

  // Deploy the Market Contract proxy
  let marketContractProxy = await deployer.deploy(
    MarketContractProxy,
    marketContractFactoryMPX.address,
    process.env.HONEYLEMON_ORACLE || accounts[0],
    minterBridge.address,
    collateralTokenAddress
  );

  console.log('👉 Deployed Market Contract Proxy');

  await marketContractProxy.transferOwnership(
    process.env.HONEYLEMON_MULTISIG || accounts[8]
  );

  // Transfer all appropriate rights from the deployed market protocol to marketContractProxy:
  // 1.a Point the 0x MinterBridge to the marketContractProxy & transfer ownership
  await minterBridge.setMarketContractProxyAddress(marketContractProxy.address);

  // 1.b Transfer registry ownership to multisig
  await minterBridge.transferOwnership(process.env.HONEYLEMON_MULTISIG || accounts[8]);

  // 2.a Ability for proxy to mint tokens for each market.
  await registry.addAddressToWhiteList(marketContractProxy.address);

  // 2.b Transfer registry ownership to multisig
  await registry.transferOwnership(process.env.HONEYLEMON_MULTISIG || accounts[8]);

  // 3.a Ability for proxy to push prices
  await marketContractFactoryMPX.setOracleHubAddress(marketContractProxy.address);

  // 3.b Ability for proxy to deploy new market protocol contracts.
  // NOTE: the Multisig is NOT the owner of the factory.
  await marketContractFactoryMPX.transferOwnership(marketContractProxy.address);

  // 4.a Lastly, transfer ownership MarketCollateralPool to the multisig
  const marketCollateralPool = await MarketCollateralPool.deployed();
  await marketCollateralPool.transferOwnership(
    process.env.HONEYLEMON_MULTISIG || accounts[8]
  );

  console.log('🙇‍♂️ Transferred permissions to proxy');
};
