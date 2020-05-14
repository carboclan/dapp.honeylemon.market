require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const infuraApikey = '9542ce9f96be4ae08225dcde36ff1638';
let mnemonic = ''; //require('./mnemonic');

module.exports = {
  networks: {
    development: {
      host: process.env.TRUFFLE_DEVELOP_HOST || 'localhost',
      port: process.env.TRUFFLE_DEVELOP_PORT || 8545,
      network_id: '*' // Match any network id
    },
    coverage: {
      host: 'localhost',
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
      provider: function() {
        return new HDWalletProvider(
          mnemonic,
          `https://kovan.infura.io/v3/${infuraApikey}`
        );
      },
      network_id: 42,
      gas: 6500000, // default = 4712388
      gasPrice: 10000000000 // default = 100 gwei = 100000000000
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
  plugins: ['@chainsafe/truffle-plugin-abigen',],
  mocha: {
    enableTimeouts: false,
    before_timeout: 120000
  }
};
