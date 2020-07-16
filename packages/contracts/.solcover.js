module.exports = {
  skipFiles: ["Migrations.sol"],
  testCommand:
    "node --max-old-space-size=4096 ../node_modules/.bin/truffle test --network coverage ./test/honeylemon/MinterBridge.test.js ./test/honeylemon/MarketContractProxy.test.js",
  compileCommand:
    "node --max-old-space-size=4096 ../node_modules/.bin/truffle compile --network coverage",
  copyPackages: ["openzeppelin-solidity"],
  norpc: false
};
