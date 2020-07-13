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

# Set interactive entrypoint conditions
USER robmc
WORKDIR /home/robmc/
RUN ln -sf /mnt/dotfiles-installer ./df
RUN ln -sf ./.nvm/nvm.sh nvm-init
RUN echo "cd df" >> .bashrc
RUN echo ". ./bootstrap.sh" >> .bashrc
ENTRYPOINT /bin/bash
