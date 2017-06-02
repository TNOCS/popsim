# Example Kafka cluster

Using `docker-compose` start and run several containers:
- zookeeper
- kafka broker
- schema registry
- REST interface

## Useful commands

Starting and stopping containers

```console
docker-compose up -d                          # Create and start the containers
docker-compose start                          # Start the containers
docker-compose ps                             # Show a list of running processes
docker-compose logs broker                    # inspect the log of the broker container
docker-compose stop                           # stop the containers
docker-compose rm -f -v                       # remove the stopped containers
docker-compose exec broker more /etc/hosts    # view the hosts file of the broker container
docker-compose exec --privileged broker bash  # start a bash console in the container as privileged user (end with exit)
```

Inspect the networks created by docker, and list the details
```console
docker network ls
docker network inspect kafka_default
```

## Using the Kafka command line tools
Download from [here]()

Create a topic
```console
..\kafka_2.12-0.10.2.1\bin\windows\kafka-topics.bat --create --topic topic1 --partitions 1 --replication-factor 1 --zookeeper localhost:2181
```

List topics
```console
..\kafka_2.12-0.10.2.1\bin\windows\kafka-topics.bat --list --zookeeper localhost:2181
```
