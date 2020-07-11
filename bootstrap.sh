#! /usr/bin/env bash

# This script installs programs and dependencies required to run the
# dotfiles-installer

set -e # Exit on any error

system_type=$(uname -s)

# ---------------------------------------------------------------------------- #
#                               Helper functions                               #
# ---------------------------------------------------------------------------- #

function log() {
    echo ">>> $1"
}

function logw() {
    echo "!!! $1"
}

function assure_installed_mac() {
    log "Looking for $1..."
    if ! [ -x "$(command -v $1)" ]; then
        log "'$1' not installed. Attempting to install..."
        brew install $1
    fi
}

function assure_installed_linux() {
    log "Looking for $1..."
    if ! [ -x "$(command -v $1)" ]; then
        log "'$1' not installed. Attempting to install..."
        sudo apt install -y $1
    fi
}

# ---------------------------------------------------------------------------- #
#                                Bootstrap system                              #
# ---------------------------------------------------------------------------- #

log "Looking for system package managers and base programs..."

if [ "$system_type" = "Darwin" ]; then

    log "Mac OS X detected. Looking for brew..."
    if ! [ -x "$(command -v brew)" ]; then
        log "Homebrew missing. Installing homebrew..."
        /usr/bin/ruby -e \
            "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    fi

    assure_installed_mac git
    assure_installed_mac curl

elif [ "$system_type" = "Linux" ]; then

    log "Linux detected. Looking for apt..."
    if ! [ -x "$(command -v apt)" ]; then
        logw  "apt isn't available and I don't know what to do :-("
        exit 1
    fi

    assure_installed_linux git
    assure_installed_linux curl
fi

# ---------------------------------------------------------------------------- #
#                               Bootstrap Node.js                              #
# ---------------------------------------------------------------------------- #

log "Assuring nvm installed..."
export NVM_DIR="$HOME/.nvm"
if [ ! -d $NVM_DIR ]; then
    log "Nvm not installed. Installing..."
    # See https://github.com/creationix/nvm#manual-install
    git clone https://github.com/creationix/nvm.git "$NVM_DIR"
    cd "$NVM_DIR"
    git checkout `git describe --abbrev=0 --tags --match "v[0-9]*" $(git rev-list --tags --max-count=1)`
    cd -
fi

log "Assuring nvm loaded..."
if ! [ -x "$(command -v nvm)" ]; then
    log "Nvm not loaded. Loading..."
    . "$NVM_DIR/nvm.sh"
fi

log "Assuring node installed..."
if ! [ -x "$(command -v node)" ]; then
    log "Node not installed. Installing latest LTS version..."
    nvm install --lts
fi

# ---------------------------------------------------------------------------- #
#                              Bootstrap installer                             #
# ---------------------------------------------------------------------------- #

log "Assuring gulp installed globally..."
if ! [ -x "$(command -v gulp)" ]; then
    log "Gulp not installed. Installing..."
    npm i -g gulp-cli
fi

log "Downloading installer dependencies..."
npm i

log "Dotfiles-installer is ready to rock!"
