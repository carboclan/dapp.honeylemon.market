type ConfigSet = {
  apiUrl: string;
  subgraphUrl: string;
  collateralTokenAddress: string;
  paymentTokenAddress: string;
  minterBridgeAddress: string;
  marketContractProxy: string;
};

interface HoneylemonConfig {
  [networkId: number]: ConfigSet;
}

const config: HoneylemonConfig = {
  // The first key is the default network that the app expected. This will also be the network that
  // Onboard.js instructs the user to switch to if they select an invalid network
  1: {
    // This is the WBTC Mainnet instance
    apiUrl: "https://api.hldev.net:3010/sra/v3/",
    subgraphUrl: "https://api.thegraph.com/subgraphs/name/carboclan/honeylemon-2d",
    collateralTokenAddress: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    paymentTokenAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    marketContractProxy: "0x5B3fab261Fd55C79552297f1A0Cc97B35dC8631a",
    minterBridgeAddress: "0xF905F6f2a482e39199BDC60b9257A62618e08C9a",
  },
  42: {
    // This is the imBTC Kovan instance
    apiUrl: "https://api.hldev.net:3001/sra/v3/",
    subgraphUrl: "https://api.hldev.net:8000/subgraphs/name/carboclan/honeylemon",
    collateralTokenAddress: "0xE2F58b9747e0b417C0D4c36390Ea40E1e064D592",
    paymentTokenAddress: "0x3CE983761C26c2F36CB438a3B0103Aa72D43B299",
    marketContractProxy: "0x23C62ed951406C1da9fbBBc455555E7c41c8e0BA",
    minterBridgeAddress: "0x085439a259E4aE8965D6b29A268bBC4Ec6d6018d",
  }
};

export default config;
