# [WIP] akinizer

A custom provisioning system to install my preferred programs and personal dotfiles.

## Supported systems

-   Mac OS X
-   Ubuntu

## Prerequisites

Git is required to install, bootstrap, and run akinizer. On Ubuntu, you can install it via `apt`:

    sudo apt update && sudo apt install git -y

On Mac OS X, you can install it via [Homebrew](https://brew.sh/):

    brew install git

## Download, bootstrap, & start

    # 1. Download akinizer to ~/opt
    mkdir -p ~/opt && \
    git clone \
        git@github.com:robatron/akinizer.git \
        ~/opt/akinizer && \

    # 2. Bootstrap required system dependencies
    cd ~/opt/akinizer && \
    . ~/bootstrap.sh && \

    # 3. Start the installer
    gulp
