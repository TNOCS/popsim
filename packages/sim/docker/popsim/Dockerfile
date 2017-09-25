FROM node:alpine
LABEL version="0.1"
LABEL Author="Erik Vullings <erik.vullings@gmail.com>"

# Build: `docker build . -t erikvullings/popsim`
# Run: `docker run -it --net="host" --rm erikvullings/popsim`

# Install git, bash and latest version of yarn
RUN apk update && \
    apk upgrade && \
    apk --update --no-cache add \
        git \
        bash && \
    apk add --no-cache --virtual .build-deps \
    ca-certificates \
    wget \
    tar && \
    cd /usr/local/bin && \
    wget https://yarnpkg.com/latest.tar.gz && \
    tar zvxf latest.tar.gz && \
    ln -s /usr/local/bin/dist/bin/yarn.js /usr/local/bin/yarn.js && \
    apk del .build-deps && \
    rm -rf /var/cache/apk/*

RUN git clone https://github.com/TNOCS/popsim
WORKDIR popsim
RUN yarn && \
    yarn run compilelibs && \
    yarn run compile
# Add broker running at localhost to /etc/hosts file in order to find it.
CMD ["/bin/sh", "-c", "echo \"127.0.0.1    broker\" >> /etc/hosts && /bin/sh"]
#     yarn run start
# RUN yarn start

# WORKDIR popsim/packages/sim

# RUN mix deps.get
# RUN mix compile
# RUN /bin/bash
# RUN cd popsim/packages/sim && \
#     /bin/sh
# CMD ["/bin/sh"]