## Local development

Useful commands:
* `make local-start` - to start docker containers and deploy all contracts. Sometimes you'd have to manually restart the `docker_api` container after, in case mesh didn't fully initialize before the api was started.
* `make local-reset` - to clean all data and restart docker containers
* `make deploy-daily-contract` - to deploy current day contract.

API URL: http://localhost:3000/sra/v3/

Subgraph URL: http://localhost:8000/subgraphs/name/honeylemon/honeylemon-graph

Ganache URL: http://localhost:8545

If running the order-test.js script, restart the local ganache instance

Ganache Accounts:
0 - Deployer - 0x5409ED021D9299bf6814279A6A1411A7e866A631 - 0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d
1 - Miner - 0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb - 0x5d862464fe9303452126c8bc94274b8c5f9874cbd219789b3eb2128075a76f72
2 - HODLER - 0xE36Ea790bc9d7AB70C55260C66D52b1eca985f84 - 0xdf02719c4df8b9b8ac7f551fcb5d9ef48fa27eef7a66453879f4d8fdc6e78fb1