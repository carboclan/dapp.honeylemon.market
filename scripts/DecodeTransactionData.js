const argv = require("minimist")(process.argv.slice(), { string: ["data"] });

const abiDecoder = require("abi-decoder");

function importAll(r) {
  return r.keys().map(r);
}

function getAllContracts() {
  let importedObjects;

  // Note: we use a try here because we don't want to install the require-context package in node.js contexts where
  // it won't work.
  try {
    // This only works in webpack.
    const requireContext = require("require-context");

    // Note: all arguments must be hardcoded here for webpack to bundle the files correctly.
    // This line also generates a few build warnings that should be ignored.
    const contractContext = require.context("../contracts/", true, /\.json$/);

    importedObjects = importAll(contractContext);
  } catch (e) {
    // This only works in node.js.
    const fs = require("fs");
    const path = require("path");
    const contractsPath = path.join(__dirname, "../contracts/");

    const fileList = fs.readdirSync(contractsPath).filter(name => name.match(/\.json$/));
    importedObjects = fileList.map(filename => {
      const fileContents = fs.readFileSync(path.join(contractsPath, filename));
      return JSON.parse(fileContents);
    });
  }

  return importedObjects;
}

function getAbiDecoder() {
  const contracts = getAllContracts();
  for (const contract of contracts) {
    abiDecoder.addABI(contract.abi);
  }

  return abiDecoder;
}

function run(data) {
  return getAbiDecoder().decodeMethod(data);
}

const decodeTransactionData = async function(callback) {
  try {
    if (!argv.data) {
      callback(
        "You must provide the transaction data using the --data argument, e.g. --data 0x1234"
      );
    } else if (!argv.data.startsWith("0x")) {
      callback(
        "The --data argument must be a hex string starting with `0x`, e.g. --data 0x1234"
      );
    }

    const txnObj = run(argv.data);

    if (!txnObj) {
      console.log("Could not identify the method that this transaction is calling.");
    } else {
      // Pretty print.
      console.log("Your decoded transaction information:");
      console.log(JSON.stringify(txnObj, null, 4));
    }
  } catch (e) {
    // Forces the script to return a nonzero error code so failure can be detected in bash.
    callback(e);
    return;
  }

  callback();
};

decodeTransactionData.run = run;
module.exports = decodeTransactionData;
