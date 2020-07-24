type ConfigSet = {
  apiUrl: string;
  subgraphUrl: string;
  collateralTokenAddress: string;
  paymentTokenAddress: string;
  marketContractProxy: string;
  minterBridgeAddress: string;
}

interface HoneylemonConfig {
  [networkId: number]: ConfigSet
}

const config: HoneylemonConfig = {
  // The first key is the default network that the app expected. This will also be the network that
  // Onboard.js instructs the user to switch to if they select an invalid network
  1: {
    // This is the WBTC Mainnet instance
    apiUrl: "https://api.honeylemon.market/sra/v3",
    subgraphUrl: "https://api.thegraph.com/subgraphs/name/carboclan/honeylemon",
    collateralTokenAddress: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    paymentTokenAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    marketContractProxy: "0x9ceb5486eD0F3F2DBCaE906E4192472e88657983",
    minterBridgeAddress: "0x5D35B6dB6d6FF772A2F9B660D028aa671752b644",
  },
  42: {
    apiUrl: "https://api.hldev.net:3000/sra/v3/",
    subgraphUrl: "https://api.thegraph.com/subgraphs/name/carboclan/honeylemon-kovan",
    collateralTokenAddress: "0xE2F58b9747e0b417C0D4c36390Ea40E1e064D592",
    paymentTokenAddress: "0x3CE983761C26c2F36CB438a3B0103Aa72D43B299",
    marketContractProxy: "0x3270070240747337Dbc27C7C7CD70D1921098eD2",
    minterBridgeAddress: "0xE874aD2963dc4BE26A69E6bA0112023aAD0Cd1c1",
  },
}

export default config;
