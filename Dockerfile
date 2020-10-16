FROM ubuntu:20.04

# Configure and install base system
ENV DEBIAN_FRONTEND="noninteractive"
ENV TZ="America/Los_Angeles"
RUN \
    apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y curl git htop python3 rsync sudo tzdata vim

# Add 'robmc' user
RUN \
    useradd --create-home --shell /bin/bash robmc && \
    usermod --append --groups sudo robmc && \
    echo "abc123\nabc123" | passwd robmc && \
    echo "Set disable_coredump false" >> /etc/sudo.conf

# Bootstrap system, compile node_modules for Linux
COPY --chown=robmc:robmc . /tmp/ak/
USER robmc
WORKDIR /tmp/ak/
RUN ls -lah
RUN AK_INSTALL_ROOT=/tmp/ak/ AK_SKIP_CLONE=yes bash bootstrap.sh

# Set interactive entrypoint conditions
USER robmc
WORKDIR /home/robmc/
COPY --chown=robmc:robmc ./deploy .
RUN ln -sf /tmp/ak ./ak
ENTRYPOINT /bin/bash
