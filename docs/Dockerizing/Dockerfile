
FROM node:latest
LABEL Name=ngbs Version=0.0.1
COPY package.json /tmp/package.json
RUN cd /tmp && yarn install --production
RUN mkdir -p /usr/src/app && mv /tmp/node_modules /usr/src
WORKDIR /usr/src/app
COPY . /usr/src/app
EXPOSE 8080

# Add Tini, see https://github.com/krallin/tini#using-tini
ENV TINI_VERSION v0.14.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

# See also https://nodesource.com/blog/8-protips-to-start-killing-it-when-dockerizing-node-js/
RUN groupadd -r nodejs \
   && useradd -m -r -g nodejs nodejs
USER nodejs

# CMD npm start
CMD ["node", "./src/server.js"]