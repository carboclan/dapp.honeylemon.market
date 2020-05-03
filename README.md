## Local development
1. `make local-api` - to start docker containers. You might need to restart the `docker_api` container if it doesn't work on the first attempt.
2. `make migrate` - to migrate Honeylemon & MarketProtocol contracts.
3. `make deploy-daily-contract` - to deploy current day contract.

API URL: http://localhost:3000/sra/v3/

Ganache URL: http://localhost:8545