type ConfigSet = {
  apiUrl: string;
  subgraphUrl: string;
  collateralTokenAddress: string;
  paymentTokenAddress: string;
  marketContractProxy: string;
  minterBridgeAddress: string;
  contractDuration: number;
};

interface HoneylemonConfig {
  [networkId: number]: ConfigSet;
}

const config: HoneylemonConfig = {
  // The first key is the default network that the app expected. This will also be the network that
  // Onboard.js instructs the user to switch to if they select an invalid network
  // 28 Day (juice.honeylemon.market)
  // 1: {
  //   // This is the WBTC Mainnet instance
  //   apiUrl: "https://api.honeylemon.market/sra/v3",
  //   subgraphUrl: "https://api.thegraph.com/subgraphs/name/carboclan/honeylemon",
  //   collateralTokenAddress: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  //   paymentTokenAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  //   marketContractProxy: "0x9ceb5486eD0F3F2DBCaE906E4192472e88657983",
  //   minterBridgeAddress: "0x5D35B6dB6d6FF772A2F9B660D028aa671752b644",
  //   contractDuration: 28
  // },
  42: {
    apiUrl: "https://api.hldev.net:3000/sra/v3/",
    subgraphUrl: "https://api.thegraph.com/subgraphs/name/carboclan/honeylemon-kovan",
    collateralTokenAddress: "0x07de306FF27a2B630B1141956844eB1552B956B5",
    paymentTokenAddress: "0xd3A691C852CDB01E281545A27064741F0B7f6825",
    marketContractProxy: "0x22684e746ee9F0137b975195B9e77672f824c7a8",
    minterBridgeAddress: "0x55B9f62C80E6aAff7B343004c1b1a5E4dA9BDdE6",
    contractDuration: 28
  }

  // 2 Day (lemonade.honeylemon.market)
  // 1: {
  //   // This is the WBTC Mainnet instance
  //   apiUrl: "https://api.hldev.net:3010/sra/v3/",
  //   subgraphUrl: "https://api.thegraph.com/subgraphs/name/carboclan/honeylemon-2d",
  //   collateralTokenAddress: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  //   paymentTokenAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  //   marketContractProxy: "0x5B3fab261Fd55C79552297f1A0Cc97B35dC8631a",
  //   minterBridgeAddress: "0xF905F6f2a482e39199BDC60b9257A62618e08C9a",
  //   contractDuration: 2
  // },
  // 42: {
  //   // This is the imBTC Kovan instance
  //   apiUrl: "https://api.hldev.net:3001/sra/v3/",
  //   subgraphUrl: "https://api.thegraph.com/subgraphs/name/carboclan/honeylemon-kovan-2d",
  //   collateralTokenAddress: "0xE2F58b9747e0b417C0D4c36390Ea40E1e064D592",
  //   paymentTokenAddress: "0x3CE983761C26c2F36CB438a3B0103Aa72D43B299",
  //   marketContractProxy: "0x23C62ed951406C1da9fbBBc455555E7c41c8e0BA",
  //   minterBridgeAddress: "0x085439a259E4aE8965D6b29A268bBC4Ec6d6018d",
  //   contractDuration: 2
  // }
};

export default config;
