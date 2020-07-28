# [WIP] akinizer

A custom provisioning system to install my preferred programs and personal dotfiles.

## Supported systems

-   Mac OS X
-   Ubuntu

## Prerequisites

Git is required to install, bootstrap, and run dotfiles-installer. On Ubuntu, you can install it via `apt`:

    sudo apt update && sudo apt install git -y

On Mac OS X, you can install it via [Homebrew](https://brew.sh/):

    brew install git

## Download, bootstrap, & start

    # 1. Download to ~/opt
    mkdir -p ~/opt && \
    git clone \
        git@github.com:robatron/dotfiles-installer.git \
        ~/opt/dotfiles-installer

    # 2. Bootstrap required system dependencies
    cd ~/opt/dotfiles-installer && \
    . ~/bootstrap.sh && \

    # 3. Start the installer
    gulp
