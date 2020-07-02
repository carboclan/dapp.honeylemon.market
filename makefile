# useful commands for Honeylemon
#

# default target
default:
	pwd

local-ganache:
	docker-compose -f ./docker/docker-compose-local.yml up -d ganache

local-ganache-wait:
	waitForGanache () { until printf 'POST /\r\nContent-Length: 26\r\n\r\n{\"method\":\"net_listening\"}' | nc localhost 8545 | grep true; do continue; done }; waitForGanache

local-docker:
	docker-compose -f ./docker/docker-compose-local.yml up -d

local-subgraph-deploy:
	cd packages/subgraph; npm run prepare:local && npm run build && npm run create:local; npm run deploy:local

local-start: local-docker local-ganache-wait migrate local-subgraph-deploy

local-stop:
	docker-compose -f ./docker/docker-compose-local.yml down

local-clean: local-stop
	rm -rf docker/.volumes

local-reset: local-clean local-start

compile:
	truffle compile

migrate:
	cd packages/contracts; truffle migrate --reset

deploy-daily-contract:
	cd packages/contracts; truffle exec scripts/deploy-daily-contract.js