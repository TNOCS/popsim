Sources:
- [Dockerizing a node.js app](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [8 protips to start killing it when dockerizing node.js](https://nodesource.com/blog/8-protips-to-start-killing-it-when-dockerizing-node-js/)
- [Using tini](https://github.com/krallin/tini#using-tini)


To build your image:

```
$ docker build -t <your username>/node-web-app .
```

Run it:

```
$ docker run -p 49160:8080 -d <your username>/node-web-app
```

Get container ID
```
$ docker ps
```

Print app output
```
$ docker logs <container id>
```

Enter the container
```
$ docker exec -it <container id> /bin/bash
```