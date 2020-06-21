# HoneyLemon - Synthetic Bitcoin cloud mining contracts on Ethereum

<p align="center">
  <img alt="HoneyLemonLogo Logo" src="./docs/Logo.png" width="300">
</p>

[![GitHub](https://img.shields.io/github/license/carboclan/dapp.honeylemon.market)](https://github.com/carboclan/dapp.honeylemon.market/blob/master/LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/carboclan/dapp.honeylemon.market)](https://github.com/carboclan/dapp.honeylemon.market/commits/master)
[![Generic badge](https://img.shields.io/badge/homepage-view-red.svg)](https://app.honeylemon.market/)
[![Generic badge](https://img.shields.io/badge/telegram-join-green.svg)](https://t.me/joinchat/I9o0JBU3JKkxb-yRSkIFvA)
![Twitter Follow](https://img.shields.io/twitter/follow/HoneylemonM?style=social)

## Documentation 📖

Our docs site is [here](https://docs.honeylemon.market). Here you will find details on the protocol design, financial contracts and main net deployment addresses.
You can also find it directly from this repo in the [documentation folder](./docs).

## Mono Repo Structure 🏗
The repository is broken up into 4 main packages, managed using yarn workspaces. You can find these in the `packages` directory. These packages are as follows:

 #### 1) **contracts**

Smart contracts, deployment scripts and integration tests for the Honeylemon protocol. The contract bring together MarketProtcol 0x MinterBridge and custom HoneyLemon contracts to create the protocols financial contracts. 
#### 2) **honeylemon.js**
Javascript library used to connect to the Honeylemon protocol. This library is used by the front end to wrap complex interactions like submitting orders or batch token redemption.

#### 3) **subgraph**
The Graph subgraph used to index contract events for front end retrieval. Used directly by `honeylemon.js`.

#### 4) **webapp**
React Typescript, dapp front end. Can be found [here](https://app.honeylemon.market).


### Development Environment 👷‍♂️

You'll need the latest LTS release of nodejs and npm installed. You'll also need Docker installed for your operating system. Assuming that's done, run:

```
yarn
```

Once this is done you can start the local development env by running a make command. This will clean all data and start/restart docker containers. Some unit tests are coupled and require you to run this between executions as well such as running If running `order-test.js` script.
```
make local-reset
```

After running this you will have a local 0x API, a Ganache instance and a Subgraph running on your local machine in docker containers. You can run `docker ps -a` to see al l the containers running.

Next, you can run the tests. There are three main tests kinds of tests: 1) Smart contract tests, 2) Honeylemon.js service tests that validate the service data retrieval and on-chain interactions including the Graph protocol and 3) integration tests that show full lifesycle interconnection between the Marketprotocol, 0x order book, DSProxy contracts and the custom honey lemon smart contracts.

TODO: UPDATE with actual commands.
```
yarn run contract-tests
yarn run honeylemon-service-tests
yarn run integration tests
```

Running the front end can be done by executing:
```
yarn start
```

If you want to deploy smart contracts to a test network you can run:
```
truffle migrate --network kovan
```

### Running The Linter 🧽

To run the formatter, run:

```
npm run lint-fix
```

## Coverage 🔎

We use the [solidity-coverage](https://github.com/sc-forks/solidity-coverage) package to generate our coverage reports.
These can be generated manually by developers. There are no regression tests or published reports. CircleCI does
generate a coverage report automatically, but if you'd like to generate it locally, run:

```
./ci/coverage.sh core
```

The full report can be viewed by opening the `core/coverage/index.html` file in a browser. The full report can be viewed by opening the `core/coverage/index.html` file in a browser. You can also find an online version of our covarge report on [coveralls](https://coveralls.io/github/dapp.honeylemon.market).





### Updating MarketContractProxy Address 🚀

When MarketContractProxy address changes it needs to be updated in the following places:

- docker/docker-compose-local.yml (look for `HONEYLEMON_MARKET_CONTARCT_PROXY_ADDRESS`)
- subgraph/subgraph.yml (in the MarketContractProxy source `address` field)
