FROM ubuntu:20.04

# Install base system
RUN \
    apt-get update && \
    apt-get install -y && \
    apt-get install sudo git -y

# Add 'robmc' user
RUN \
    useradd --create-home --shell /bin/bash robmc && \
    usermod --append --groups sudo robmc && \
    echo "abc123\nabc123" | passwd robmc && \
    echo "Set disable_coredump false" >> /etc/sudo.conf

# Clean install dotfiles-installer
WORKDIR /home/robmc/
COPY . ./opt/dotfiles-installer
RUN cd ./opt/dotfiles-installer && \
    git clean -xdf
RUN chown -R robmc:robmc .

# Set interactive entrypoint conditions
USER robmc
ENTRYPOINT /bin/bash
