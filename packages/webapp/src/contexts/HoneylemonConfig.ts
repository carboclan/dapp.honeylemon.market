type ConfigSet = {
  apiUrl: string;
  subgraphUrl: string;
  collateralTokenAddress: string;
  paymentTokenAddress: string;
  minterBridgeAddress: string;
  marketContractProxy: string;
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

    minterBridgeAddress: "0xF905F6f2a482e39199BDC60b9257A62618e08C9a",
    marketContractProxy: "0x5B3fab261Fd55C79552297f1A0Cc97B35dC8631a",
  },
}

export default config;