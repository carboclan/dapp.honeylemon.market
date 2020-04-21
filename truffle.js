require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: process.env.TRUFFLE_DEVELOP_HOST || 'localhost',
      port: process.env.TRUFFLE_DEVELOP_PORT || 8545,
      network_id: '*' // Match any network id
    },
    coverage: {
      host: 'truffle-coverage',
      network_id: '*', // eslint-disable-line camelcase
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01
    },
    ganache: {
      host: 'localhost',
      port: 9545,
      network_id: '*' // Match any network id
    },
    kovan: {
      host: process.env.KOVAN_API_URL,
      port: 443,
      network_id: '42',
      provider: new HDWalletProvider(process.env.KOVAN_MNEMONIC, `https://${process.env.KOVAN_API_URL}`),
      gas: 9990000
    }
  },
  compilers: {
    solc: {
      version: '0.5.2',
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  plugins: ['@chainsafe/truffle-plugin-abigen']
};
