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

## [WIP] Usage

Modify `PACKAGES.js` and run `gulp` after changes.

## TODO

-   ~~Create tasks the recommended way~~
-   ~~Configure GitHub Actions for continuous testing~~
-   ~~Create and validate package defs~~
-   ~~Combine "phase" and "package", allow arbitrary structures~~
-   Validate definitions (Phase & Package) w/ unit tests
-   Convert to TypeScript (?)
-   Support ES6 imports
-   Add eslint, prettier
-   Remove local docker stuff
-   Rename dotfiles-installer -> assimilator
-   Document API
