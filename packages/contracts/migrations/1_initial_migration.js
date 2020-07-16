var Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer, network) {
  if (network == "skip-migrations") return;

  deployer.deploy(Migrations);
};
