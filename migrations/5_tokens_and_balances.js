const PaymentToken = artifacts.require('PaymentToken');
const CollateralToken = artifacts.require('CollateralToken');

module.exports = async function(deployer, network, accounts) {
  // Deploy USDC token
  await deployer.deploy(PaymentToken, 'USDC', 'USDC', '10000000000', 6);
  const paymentToken = await PaymentToken.deployed();

  // Give some payment token to investor
  await paymentToken.transfer(accounts[2], '10000000000');

  console.log('💰 Transferred balances');
};
