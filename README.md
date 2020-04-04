## How to run
1. Setup local testnet with 0x contracts deployed: https://hub.docker.com/r/0xorg/ganache-cli
2. `npm install`
3. `truffle migrate --reset`
4. `truffle exec order-test.js` - that's where the POC script is

Relevant contracts are in `contracts/honeylemon`, the rest of the contracts are taken from the Market protocol repo.

