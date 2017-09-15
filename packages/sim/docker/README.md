# Building a Docker image of the Elixir simulation

In order to build a Docker image of the Elixir simulation, I have created two `Dockerfile`s:
- base: taking a default Elixir image, and adding gcc, make, bash etc. in order to be able to build some of its dependencies
- sim: which adds this git repo, compiles it, and offers you a bash prompt to start the simulation manually

The reason to create 2 files instead of one is that you don't have to build the base every time you make a change to the simulation, e.g. after including a new dependency.

Below, I've indicated the steps you need to follow in order to build the Docker images and run their containers.

## Building the base

Change the directory to the base folder, and run:
```c
docker build . -t erikvullings/elixir_full
```
If you decide to change the (tagged) image name (the part after the -t), make sure that you also change that name in the `Dockerfile` that can be found in the `sim` folder.

## Building the base

Change the directory to the sim folder, and run:
```c
docker build . -t erikvullings/sim
```

Now you should have a working image, and you can create and run a new container as follows:
```c
docker run -it --net="host" --rm erikvullings/sim
iex -S mix
```

# Updating the image
When the source code has changed, you need to rebuild the `sim` image. First, delete the image using:
```c
docker rmi erikvullings/sim
```
If `docker` complains about an existing container that uses this image, delete the container too using:
```c
docker rm CONTAINER_NAME
```

