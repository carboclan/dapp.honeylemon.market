//Ox libs and tools

const { RPCSubprovider, Web3ProviderEngine } = require('@0x/subproviders');
const {
  generatePseudoRandomSalt,
  Order,
  orderHashUtils,
  signatureUtils,
  SignedOrder,
  assetDataUtils
} = require('@0x/order-utils');
const { ContractWrappers } = require('@0x/contract-wrappers');
const { Web3Wrapper } = require('@0x/web3-wrapper');
const { BigNumber } = require('@0x/utils');

// const AssetDataUtils = artifacts.require('AssetDataUtils');
// const FakeToken = artifacts.require('FakeToken');
//TODO: Add Dai

//Contracts
const CollateralToken = artifacts.require('CollateralToken'); // IMBTC
const MinterBridge = artifacts.require('MinterBridge');
const MarketContractProxy = artifacts.require('MarketContractProxy');

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

module.exports = async function() {
  try {
    // params to init 0x setup
    const provider = web3.currentProvider;

    // Then use the provider
    const chainId = 1337;
    const contractWrappers = new ContractWrappers(provider, { chainId });
    const web3Wrapper = new Web3Wrapper(provider);

    const collateralToken = await CollateralToken.deployed();
    const minterBridge = await MinterBridge.deployed();
    const marketContractProxy = await MarketContractProxy.deployed();

    const addresses = await web3Wrapper.getAvailableAddressesAsync();

    // Used accounts
    const honeyLemonOracle = addresses[0]; // Deployed all contracts. Has permission to push prices
    const makerAddress = addresses[1]; // Miner
    const takerAddress = addresses[2]; // Investor

    /********************************************
     * Honey Lemon oracle deploy daily contract *
     ********************************************/

    let contractSpecs = await marketContractProxy.generateContractSpecs.call();
    console.log('spects');
    console.log(contractSpecs);

    // Create Todays market protocol contract
    await marketContractProxy.deployContract();

    // Get the address of todays marketProtocolContract
    let deployedContracts = await marketContractProxy.marketContracts(0);
    console.log('Deployed market contracts', deployedContracts);

    /*********************
     * Generate 0x order *
     *********************/

    // Taker token is imBTC sent to collateralize the contractWe use CollateralToken.
    // This is imBTC sent from the investor to the Market protocol contract
    const takerToken = { address: collateralToken.address, decimals: 18 };

    // 0x sees the marketContractProxy as the maker token. This has a `balanceOf` method to get 0x
    // to think the order has processed.
    const makerToken = { address: marketContractProxy.address };

    // Encode the selected makerToken as assetData for 0x
    const makerAssetData = assetDataUtils.encodeERC20BridgeAssetData(
      makerToken.address,
      minterBridge.address,
      '0x0000'
    );
    console.log('decodeAssetDataOrThrow', assetDataUtils.decodeAssetDataOrThrow(makerAssetData));

    console.log('makerAssetData:', makerAssetData);
    console.log('takerToken.address', takerToken.address);
    // Encode the selected takerToken as assetData for 0x
    const takerAssetData = await contractWrappers.devUtils.encodeERC20AssetData(takerToken.address).callAsync();
    console.log('takerAssetData:', takerAssetData);
    // Amounts are in Unit amounts, 0x requires base units (as many tokens use decimals)
    const makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 0);
    const takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 0);
    const exchangeAddress = contractWrappers.exchange.address;

    // Approve the contract wrapper from 0x to pull imBTC from the taker(investor)
    await collateralToken.approve(contractWrappers.contractAddresses.erc20Proxy, new BigNumber(10).pow(256).minus(1), {
      from: takerAddress
    });

    // Generate the 0x order
    const order = {
      makerAddress, // maker is the first address (miner)
      takerAddress: NULL_ADDRESS, // taker is open and can be filled by anyone (when an investor comes along)
      makerAssetAmount, // The maker asset amount
      takerAssetAmount, // The taker asset amount
      expirationTimeSeconds: new BigNumber(Math.round(Date.now() / 1000) + 10 * 60), // Time when this order expires
      makerFee: 0, // 0 maker fees
      takerFee: 0, // 0 taker fees
      feeRecipientAddress: NULL_ADDRESS, // No fee recipient
      senderAddress: NULL_ADDRESS, // Sender address is open and can be submitted by anyone
      salt: generatePseudoRandomSalt(), // Random value to provide uniqueness
      makerAssetData,
      takerAssetData,
      exchangeAddress,
      makerFeeAssetData: '0x',
      takerFeeAssetData: '0x',
      chainId
    };

    // Generate the order hash and sign it
    const signedOrder = await signatureUtils.ecSignOrderAsync(provider, order, makerAddress);
    console.log('signedOrder:', signedOrder);

    console.log('contractWrappers.exchange', contractWrappers.exchange.address);

    // Fill order
    const txHash = await contractWrappers.exchange
      .fillOrder(signedOrder, makerAssetAmount, signedOrder.signature)
      .sendTransactionAsync({ from: takerAddress, gas: 6700000, value: 3000000000000000 }); // value is required to pay 0x fees
    console.log('txHash:', txHash);
  } catch (e) {
    console.log(e);
  }

  process.exit();
};
