# useful commands for Honeylemon
#

# default target
default:
	pwd

local-ganache:
	docker-compose -f ./docker/docker-compose-local.yml up -d ganache

local-api:
	docker-compose -f ./docker/docker-compose-local.yml up -d

local-start: local-api
	waitForGanache () { until printf 'POST /\r\nContent-Length: 26\r\n\r\n{\"method\":\"net_listening\"}' | nc localhost 8545 | grep true; do continue; done }; waitForGanache
	truffle migrate --reset

local-stop:
	docker-compose -f ./docker/docker-compose-local.yml down

local-clean: local-stop
	rm -rf .volumes

local-reset: local-clean local-start

compile:
	truffle compile

migrate:
	truffle migrate --reset

deploy-daily-contract:
	truffle exec deploy-daily-contract.js