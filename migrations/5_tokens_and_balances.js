const PaymentToken = artifacts.require('PaymentToken');
const CollateralToken = artifacts.require('CollateralToken');

module.exports = async function(deployer, network, accounts) {
  // Deploy the Market Contract proxy
  await deployer.deploy(PaymentToken, 'USDC', 'USDC', '20000000000000000000000', 18);
  const paymentToken = await PaymentToken.deployed();

  // Give some payment token to investor
  await paymentToken.transfer(accounts[2], '10000000000000000000000');

  // Give some collateral token to miner
  const collateralToken = await CollateralToken.deployed();
  collateralToken.transfer(accounts[1], 100000);

  console.log('Transferred balances');
};
