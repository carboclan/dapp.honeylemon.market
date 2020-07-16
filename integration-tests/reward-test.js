const assert = require("assert").strict;
const { time } = require("@openzeppelin/test-helpers");
const { BigNumber } = require("@0x/utils");
const { Web3Wrapper } = require("@0x/web3-wrapper");

const { HoneylemonService } = require("../src/lib/HoneylemonService");
const delay = require("../test/helpers/delay");

const MarketContractProxy = artifacts.require("MarketContractProxy");

let honeylemonService,
  marketContractProxy,
  ownerAddress,
  makerAddress,
  takerAddress = null;

async function fill0xOrderForAddresses(size, taker, maker) {
  const fillSize = new BigNumber(size);

  const { resultOrders, takerAssetFillAmounts } = await honeylemonService.getQuoteForSize(
    fillSize
  );
  await honeylemonService.approveCollateralToken(maker);
  await honeylemonService.approvePaymentToken(taker);
  const gasPrice = 5e9; // 5 GWEI
  const tx = await honeylemonService.getFillOrdersTx(resultOrders, takerAssetFillAmounts);
  const value = await honeylemonService.get0xFeeForOrderBatch(
    gasPrice,
    resultOrders.length
  );
  const gas = await honeylemonService.estimateGas(
    resultOrders,
    takerAssetFillAmounts,
    taker
  );
  const txHash = await tx.sendTransactionAsync({
    from: taker,
    gas,
    gasPrice,
    value
  });
}

async function createNewMarketProtocolContract(lookbackIndex, mriInput, marketName) {
  let currentContractTime = (await marketContractProxy.getTime.call()).toNumber();
  let contractDuration = (await marketContractProxy.CONTRACT_DURATION()).toNumber();
  let expirationTime = currentContractTime + contractDuration;

  const currentMRIScaled = new BigNumber(mriInput).shiftedBy(8); //1e8
  const lookbackScaled = new BigNumber(lookbackIndex).shiftedBy(8); //1e8
  await marketContractProxy.dailySettlement(
    lookbackScaled.toString(),
    currentMRIScaled.toString(), // current index value
    [
      web3.utils.utf8ToHex(marketName),
      web3.utils.utf8ToHex(marketName + "-Long"),
      web3.utils.utf8ToHex(marketName + "-Short")
    ], // new market name
    expirationTime.toString(), // new market expiration
    {
      from: ownerAddress
    }
  );
}

async function createOrders() {
  const orderParams = [
    {
      sizeTh: new BigNumber(1000),
      pricePerTh: new BigNumber(3.6)
    },
    {
      sizeTh: new BigNumber(1200),
      pricePerTh: new BigNumber(3.7)
    },
    {
      sizeTh: new BigNumber(3600),
      pricePerTh: new BigNumber(3.9)
    }
  ];
  const expirationTime = new BigNumber(
    Math.round(Date.now() / 1000) + 365 * 24 * 60 * 60
  ); // 1 year
  const orders = orderParams.map(p =>
    honeylemonService.createOrder(makerAddress, p.sizeTh, p.pricePerTh, expirationTime)
  );
  const signedOrders = await Promise.all(orders.map(o => honeylemonService.signOrder(o)));

  // Submit orders to the API
  await Promise.all(signedOrders.map(o => honeylemonService.submitOrder(o)));
}

async function main() {
  const chainId = 1337;
  const mriInput = 0.00001833;
  honeylemonService = new HoneylemonService(
    process.env.SRA_URL,
    process.env.SUBGRAPH_URL,
    web3.currentProvider,
    chainId
  );
  marketContractProxy = await MarketContractProxy.deployed();

  // Set addresses
  const web3Wrapper = new Web3Wrapper(web3.currentProvider);
  const addresses = await web3Wrapper.getAvailableAddressesAsync();
  ownerAddress = addresses[0]; // Deployed all contracts. Has permission to push prices
  makerAddress = addresses[1]; // Miner
  takerAddress = addresses[2]; // Investor

  // Give approval for maker
  await honeylemonService.approveCollateralToken(makerAddress);

  // Create orders
  await createOrders();

  // Create positions for long and short token holder
  const fillSize = new BigNumber(1);

  // deploy first contract
  console.log("Deploying first contract...");
  await createNewMarketProtocolContract(mriInput * 28, mriInput, "MRI-BTC-28D-test");

  console.log("Filling 3 orders...");
  // Give approval for taker
  await honeylemonService.approvePaymentToken(takerAddress);
  // Create two contracts. taker participates as a taker in both. Maker is only involved
  // in the first contract.
  await fill0xOrderForAddresses(1, takerAddress, makerAddress);
  // await time.increase(10); // increase by 10 seconds to signify 1 day
  await fill0xOrderForAddresses(2, takerAddress, makerAddress);
  // await time.increase(10); // increase by 10 seconds to signify 1 day
  await fill0xOrderForAddresses(3, takerAddress, makerAddress);

  console.log("Deploying 28 contracts...");
  // fast forward 28 days
  await time.increase(28 * 24 * 60 * 60 + 1);
  // we need to deploy 28 times in order to be able to settle
  await Promise.all(
    Array.from({ length: 28 }, (x, i) => {
      return createNewMarketProtocolContract(mriInput * 28, mriInput, "MRI-BTC-28D-test");
    })
  );

  console.log("Filling one more order...");
  await fill0xOrderForAddresses(4, takerAddress, makerAddress);
  console.log("Deploying another contract...");
  await createNewMarketProtocolContract(mriInput * 28, mriInput, "MRI-BTC-28D-test");
  console.log("Filling the final order...");
  await fill0xOrderForAddresses(5, takerAddress, makerAddress);

  // Wait for subgraph to index the events
  await delay(3000);

  // Get contracts object from HoneyLemonService
  const { longPositions, shortPositions } = await honeylemonService.getPositions(
    takerAddress
  );

  const {
    longPositions: longPositions2,
    shortPositions: shortPositions2
  } = await honeylemonService.getPositions(makerAddress);

  console.log("longPositions:", JSON.stringify(longPositions, null, 4));
  console.log("shortPositions2:", JSON.stringify(shortPositions2, null, 4));
}

module.exports = async () => {
  try {
    await main();
  } catch (err) {
    console.error(err);
  }
};
