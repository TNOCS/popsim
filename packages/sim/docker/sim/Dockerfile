FROM erikvullings/elixir_full
MAINTAINER Erik Vullings <erik.vullings@gmail.com>

# Build: `docker build . -t erikvullings/sim`
# Run: `docker run -it --net="host" --rm erikvullings/sim`

RUN git clone https://github.com/TNOCS/popsim

WORKDIR popsim/packages/sim

RUN mix deps.get
RUN mix compile
RUN /bin/bash
# RUN cd popsim/packages/sim && \
#     /bin/sh
# CMD ["/bin/sh"]