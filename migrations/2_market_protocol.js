const MathLib = artifacts.require('MathLib');
const StringLib = artifacts.require('./libraries/StringLib.sol');
const MarketToken = artifacts.require('./tokens/MarketToken.sol');
const MarketContractMPX = artifacts.require('./mpx/MarketContractMPX.sol');
const MarketContractFactory = artifacts.require('./mpx/MarketContractFactoryMPX.sol');
const MarketCollateralPool = artifacts.require('./MarketCollateralPool.sol');
const MarketContractRegistry = artifacts.require('./MarketContractRegistry.sol');

module.exports = async function(deployer, network, accounts) {
  if (network !== 'live') {
    const gasLimit = (await web3.eth.getBlock('latest')).gasLimit;

    return deployer.deploy(MarketToken).then(function() {
      return deployer.deploy(StringLib).then(function() {
        return deployer.deploy(MathLib).then(function() {
          return deployer.deploy(MarketContractRegistry).then(function() {
            return deployer
              .link(MathLib, [MarketContractMPX, MarketCollateralPool, MarketContractFactory])
              .then(function() {
                return deployer.link(StringLib, MarketContractMPX).then(function() {
                  return deployer
                    .deploy(MarketCollateralPool, MarketContractRegistry.address, MarketToken.address)
                    .then(function() {
                      return MarketCollateralPool.deployed().then(function() {
                        return deployer
                          .deploy(
                            MarketContractFactory,
                            MarketContractRegistry.address,
                            MarketCollateralPool.address,
                            accounts[0],
                            {
                              gas: gasLimit
                            }
                          )
                          .then(function(factory) {
                            return MarketContractRegistry.deployed().then(function(registryInstance) {
                              return registryInstance.addFactoryAddress(factory.address).then(function() {
                                console.log('💹Done Market Migration!');
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
    });
  }
};
