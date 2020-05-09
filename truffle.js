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
  plugins: ['@chainsafe/truffle-plugin-abigen'],
  mocha: {
    enableTimeouts: false,
    before_timeout: 120000 // Here is 2min but can be whatever timeout is suitable for you.
  }
};
