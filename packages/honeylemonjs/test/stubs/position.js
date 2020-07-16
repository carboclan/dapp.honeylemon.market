module.exports = ({
  marketId = 1,
  qtyToMint = 1,
  makerAddress = "0x6ecbe1db9ef729cbe972c83fb886247691fb6beb",
  takerAddress = "0xe36ea790bc9d7ab70c55260c66d52b1eca985f84",
  time = "1590264097",
  longTokenDSProxy = "0xe36ea790bc9d7ab70c55260c66d52b1eca985f84",
  shortTokenDSProxy = "0x6ecbe1db9ef729cbe972c83fb886247691fb6beb",
  contract: {
    collateralPerUnit = 69287,
    contractName = "MRI-BTC-28D-test",
    isSettled = false,
    revenuePerUnit = 51324
  } = {},
  transaction: {
    id: transactionId = "someid",
    fills = [
      {
        makerAssetFilledAmount: 1,
        takerAssetFilledAmount: 3600
      }
    ]
  } = {}
}) => {
  const position = {
    contract: {
      collateralPerUnit: collateralPerUnit.toString(),
      expiration: "1592683292",
      id: "0x3c805826a2bbbcf45b1564ace51ead69aeb642d8",
      index: marketId.toString(),
      settlement: null
    },
    contractName: contractName.toString(),
    createdAt: "88",
    id: "1-0x1eff12a880b625113d0799b1a229e45ed2e8147fcb0b8472457d862e9bf0a966-16",
    longTokenAddress: "0xa78c389dfbecf13a12fe8b3a9b48ed17d6861853",
    longTokenDSProxy,
    longTokenRecipient: {
      id: takerAddress
    },
    marketId: marketId.toString(),
    qtyToMint: qtyToMint.toString(),
    shortTokenAddress: "0x75360fd35e1c2a204647fe10f7fed923b9c8c9c8",
    shortTokenDSProxy,
    shortTokenRecipient: {
      id: makerAddress
    },
    time: time.toString(),
    transaction: {
      id: transactionId,
      blockNumber: "88",
      fills: fills
    }
  };

  if (isSettled) {
    position.contract.settlement = {
      revenuePerUnit: revenuePerUnit.toString()
    };
  }

  return position;
};
