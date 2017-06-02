# popsim
Create a population simulator based on open data sources in The Netherlands.

## Getting started

Install the following dependencies if you haven't got them already:
```console
npm i -g lerna yarn
```

Initialise the repo (NOTE: You need to run this command also when adding a new package dependency, after which in vs-code, you need to reload your window)
```console
yarn run install
```

Watch and transpile each package in parallel
```console
yarn run build
```

## Running the services

To run all the services, first make sure that docker is running Kafka using

```console
cd kafka
docker-compose ps
docker-compose up -d
cd ..
```
Or, alternatively, run `yarn run up`.

From the root folder, start all services with:
```console
yarn start
```
On Windows, you can use `CTRL-C` twice to stop them.

## Cleaning up Kafka

```console
cd kafka
docker-compose stop
docker-compose rm -f -v
cd ..
```

Alternatively, from the root folder, you can simply run `yarn run stop` to stop it, or `yarn run clean` to remove the created volumes too (effectively removing any history).


