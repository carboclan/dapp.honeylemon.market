const MathLib = artifacts.require('MathLib');
const StringLib = artifacts.require('./libraries/StringLib.sol');
const MarketContractMPX = artifacts.require('./mpx/MarketContractMPX.sol');
const MarketContractFactory = artifacts.require('./mpx/MarketContractFactoryMPX.sol');
const MarketCollateralPool = artifacts.require('./MarketCollateralPool.sol');
const MarketContractRegistry = artifacts.require('./MarketContractRegistry.sol');

module.exports = async function(deployer, network, accounts) {
  if (network == 'skip-migrations') return;

  // Note ownership transfer of MarketContractFactory, MarketCollateralPool and MarketContractRegistry occur
  // in a later migration after the MarketContractProxy has been deployed.
  await deployer.deploy(StringLib);
  await deployer.deploy(MathLib);
  await deployer.deploy(MarketContractRegistry);
  await deployer.link(MathLib, [
    MarketContractMPX,
    MarketCollateralPool,
    MarketContractFactory
  ]);
  await deployer.link(StringLib, MarketContractMPX);
  await deployer.deploy(
    MarketCollateralPool,
    MarketContractRegistry.address,
    '0x0000000000000000000000000000000000000000' // Market token Address should be unset.
  );
  const factory = await deployer.deploy(
    MarketContractFactory,
    MarketContractRegistry.address,
    MarketCollateralPool.address,
    accounts[0]
  );
  const registryInstance = await MarketContractRegistry.deployed();
  await registryInstance.addFactoryAddress(factory.address);
  console.log('💹 Done Market Migration!');
};
