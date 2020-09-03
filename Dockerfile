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

# Bootstrap & install
RUN apt-get install curl -y
COPY . /tmp/ak/
RUN chown -R robmc:robmc /tmp/ak/
USER robmc
RUN cd /tmp/ak/ && bash bootstrap.sh

# Set interactive entrypoint conditions
USER robmc
WORKDIR /home/robmc/
RUN ln -sf /tmp/ak ./ak
RUN ln -sf ~/.nvm/nvm.sh nvm-init
RUN echo "cd ~/ak" >> .bashrc
ENTRYPOINT /bin/bash
