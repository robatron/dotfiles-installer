# dotfiles-installer

> Installs my personal dotfiles and programs

## Prerequisites

Ubuntu:

    sudo apt update && \
        sudo apt upgrade -y && \
        sudo apt install git -y

Mac OS X:

    # Install Homebrew
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"

    # Install git
    brew install git

## Install

    mkdir -p ~/opt && /
        git clone \
            git@github.com:robatron/dotfiles-installer.git ~/opt/dotfiles-installer && /
        ~/opt/bootstrap.sh

## Update (WIP)

    dotfiles update

## Testing (WIP)

Assure [Docker](https://docs.docker.com/engine/install/ubuntu/) is installed.

## TODO

-   Create tasks the recommended way
-   Convert to TypeScript
-   Validate definitions (Phase & Package)
-   Combine "phase" and "package", allow arbitrary structures
