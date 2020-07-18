# [WIP] dotfiles-installer

[![Tests](https://github.com/robatron/dotfiles-installer/workflows/Tests/badge.svg)](https://github.com/robatron/dotfiles-installer/actions)

A custom provisioning system to install my preferred programs and personal dotfiles

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

    # Download and bootstrap the installer
    mkdir -p ~/opt && /
    git clone \
        git@github.com:robatron/dotfiles-installer.git \
        ~/opt/dotfiles-installer && /
    . ~/opt/bootstrap.sh && \

    # Run the installer
    gulp

## Usage

TBD.

## TODO

-   ~~Create tasks the recommended way~~
-   ~~Configure GitHub Actions for continuous testing~~
-   Create and validate package defs
-   Combine "phase" and "package", allow arbitrary structures
-   Validate definitions (Phase & Package)
-   Convert to TypeScript
