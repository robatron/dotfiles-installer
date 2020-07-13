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

# Bootstrap
RUN apt-get install curl -y
USER robmc
COPY . /tmp/copied-dotfiles
RUN cd /tmp/copied-dotfiles
RUN bash /tmp/copied-dotfiles/bootstrap.sh

# Set interactive entrypoint conditions
USER robmc
WORKDIR /home/robmc/
RUN ln -sf /mnt/dotfiles-installer ./df
RUN ln -sf ./.nvm/nvm.sh nvm-init
ENTRYPOINT /bin/bash
