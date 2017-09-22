FROM bitwalker/alpine-elixir
MAINTAINER Erik Vullings <erik.vullings@gmail.com>

# Run `docker build . -t erikvullings/elixir_full`

# VOLUME ["/project"]
# WORKDIR ["/project"]

RUN apk update && \
    apk upgrade && \
    apk --update --no-cache add \
        gcc \
        g++ \
        build-base \
        cmake \
        make \
        bash \
        libstdc++ && \
    rm -rf /var/cache/apk/*

# RUN git clone https://github.com/TNOCS/popsim
# RUN cd popsim/packages/sim && \
#     mix deps.get
# RUN cd popsim/packages/sim && \
#     iex -S mix
# CMD ["/bin/sh"]