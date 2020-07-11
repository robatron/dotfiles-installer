FROM ubuntu:20.04

# Install base system
RUN DEBIAN_FRONTEND="noninteractive"
RUN \
    apt-get update && \
    apt-get install -y && \
    apt-get install sudo && \
    apt-get install tzdata && \
    apt-get unzip

# Add 'robmc' user
RUN \
    useradd --create-home --shell /bin/bash robmc && \
    usermod --append --groups sudo robmc && \
    echo "abc123\nabc123" | passwd robmc && \
    echo "Set disable_coredump false" >> /etc/sudo.conf

# Set entrypoint conditions
USER robmc
WORKDIR /home/robmc/
RUN ln -s /tmp/dotfiles-installer /home/robmc/df
ENTRYPOINT /bin/bash
