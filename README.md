## Local development

Useful commands:
* `make local-start` - to start docker containers and deploy all contracts. Sometimes you'd have to manually restart the `docker_api` container after, in case mesh didn't fully initialize before the api was started.
* `make local-reset` - to clean all data and restart docker containers
* `make deploy-daily-contract` - to deploy current day contract.

API URL: http://localhost:3000/sra/v3/

Subgraph URL: http://localhost:8000/subgraphs/name/honeylemon/honeylemon-graph

Ganache URL: http://localhost:8545