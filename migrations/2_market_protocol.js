const MathLib = artifacts.require('MathLib');
const StringLib = artifacts.require('./libraries/StringLib.sol');
const MarketContractMPX = artifacts.require('./mpx/MarketContractMPX.sol');
const MarketContractFactory = artifacts.require('./mpx/MarketContractFactoryMPX.sol');
const MarketCollateralPool = artifacts.require('./MarketCollateralPool.sol');
const MarketContractRegistry = artifacts.require('./MarketContractRegistry.sol');

module.exports = async function(deployer, network, accounts) {
  if (network == 'skip-migrations') return;

  // TODO: refactor this to not use .then notation in favour of using awaits
  // Note ownership transfer of MarketContractFactory, MarketCollateralPool and MarketContractRegistry occur
  // in a later migration after the MarketContractProxy has been deployed.
  deployer.deploy(StringLib).then(function() {
    return deployer.deploy(MathLib).then(function() {
      return deployer.deploy(MarketContractRegistry).then(function() {
        return deployer
          .link(MathLib, [MarketContractMPX, MarketCollateralPool, MarketContractFactory])
          .then(function() {
            return deployer.link(StringLib, MarketContractMPX).then(function() {
              return deployer
                .deploy(
                  MarketCollateralPool,
                  MarketContractRegistry.address,
                  '0x0000000000000000000000000000000000000000' // Market token Address should be unset.
                )
                .then(function() {
                  return MarketCollateralPool.deployed().then(function() {
                    return deployer
                      .deploy(
                        MarketContractFactory,
                        MarketContractRegistry.address,
                        MarketCollateralPool.address,
                        accounts[0]
                      )
                      .then(function(factory) {
                        return MarketContractRegistry.deployed().then(function(
                          registryInstance
                        ) {
                          return registryInstance
                            .addFactoryAddress(factory.address)
                            .then(function() {
                              console.log('💹 Done Market Migration!');
                            });
                        });
                      });
                  });
                });
            });
          });
      });
    });
  });
};
