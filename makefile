# useful commands for Honeylemon
#

# default target
default:
	pwd

local-ganache:
	docker-compose -f ./docker/docker-compose-local.yml up -d ganache

local-api:
	docker-compose -f ./docker/docker-compose-local.yml up -d

local-stop:
	docker-compose -f ./docker/docker-compose-local.yml down

compile:
	truffle compile

migrate:
	truffle migrate --reset

deploy-daily-contract:
	truffle exec deploy-daily-contract.js