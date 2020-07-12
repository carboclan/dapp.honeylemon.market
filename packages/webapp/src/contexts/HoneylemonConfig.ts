type ConfigSet = {
  apiUrl: string;
  subgraphUrl: string;
  collateralTokenAddress: string;
  paymentTokenAddress: string;
  marketContractProxy: string;
  minterBridgeAddress: string;
}

export interface HoneylemonConfig {
  [networkId: number]: ConfigSet
}

const config: HoneylemonConfig = {
  // The first key is the default network that the app expected. This will also be the network that
  // Onboard.js instructs the user to switch to if they select an invalid network
  1: {
    apiUrl: "https://api.honeylemon.market/sra/v3",
    subgraphUrl: "https://api.thegraph.com/subgraphs/name/carboclan/honeylemon",
    collateralTokenAddress: "0x3212b29e33587a00fb1c83346f5dbfa69a458923",
    paymentTokenAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    marketContractProxy: "0xDCe36F47ea4b3b367E424baC1D37Bb62E1361342",
    minterBridgeAddress: "0xF5F91F83872727aB02E8AfED2ca8e14EF2cA34C0",
  },
  42: {
    apiUrl: "https://api.hldev.net:3000/sra/v3/",
    subgraphUrl: "https://api.thegraph.com/subgraphs/name/carboclan/honeylemon-kovan",
    collateralTokenAddress: "0xE2F58b9747e0b417C0D4c36390Ea40E1e064D592",
    paymentTokenAddress: "0x3CE983761C26c2F36CB438a3B0103Aa72D43B299",
    marketContractProxy: "0x3270070240747337Dbc27C7C7CD70D1921098eD2",
    minterBridgeAddress: "0xE874aD2963dc4BE26A69E6bA0112023aAD0Cd1c1",
  }
}

export default config;