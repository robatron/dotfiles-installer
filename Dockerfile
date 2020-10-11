FROM ubuntu:20.04

# Configure and install base system
ENV DEBIAN_FRONTEND="noninteractive"
RUN \
    apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y git htop rsync sudo vim

# Configure and install timezone
ENV TZ="America/Los_Angeles"
RUN apt-get -y install tzdata

# Add 'robmc' user
RUN \
    useradd --create-home --shell /bin/bash robmc && \
    usermod --append --groups sudo robmc && \
    echo "abc123\nabc123" | passwd robmc && \
    echo "Set disable_coredump false" >> /etc/sudo.conf

# Bootstrap system, compile node_modules
RUN apt-get install curl -y
COPY --chown=robmc:robmc . /tmp/ak/
USER robmc
RUN cd /tmp/ak/ && bash bootstrap.sh

# Set interactive entrypoint conditions
USER robmc
WORKDIR /home/robmc/
COPY --chown=robmc:robmc ./deploy .
RUN ln -sf /tmp/ak ./ak
ENTRYPOINT /bin/bash
