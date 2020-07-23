#! /usr/bin/env bash

# This is the BOOTSTRAPPER script that installs system programs and dependencies
# required to run the dotfiles-installer

set -e # Exit on any error

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
PLATFORM=$(uname -s)

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

if [ "$PLATFORM" = "Darwin" ]; then
    log "Mac OS X detected. Looking for brew..."

    if ! [ -x "$(command -v brew)" ]; then
        log "Homebrew missing. Installing homebrew..."
        /usr/bin/ruby -e \
            "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    fi

    assure_installed_mac curl

elif [ "$PLATFORM" = "Linux" ]; then
    log "Linux detected. Looking for apt..."

    if ! [ -x "$(command -v apt)" ]; then
        logw  "apt isn't available and I don't know what to do :-("
        exit 1
    fi

    assure_installed_linux curl
fi

# ---------------------------------------------------------------------------- #
#                               Bootstrap Node.js                              #
# ---------------------------------------------------------------------------- #

log "Assuring nvm installed..."
export NVM_DIR="$HOME/.nvm"
if [ ! -d $NVM_DIR ]; then
    log "Nvm not installed. Installing..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
fi

log "Assuring nvm loaded..."
if ! [ -x "$(command -v nvm)" ]; then
    log "Nvm not loaded. Loading..."
    . "$NVM_DIR/nvm.sh"
fi

log "Assuring node installed..."
if ! [ -x "$(command -v node)" ]; then
    log "Node not installed. Installing latest LTS version and latest npm..."
    nvm install --lts --latest-npm
fi

# ---------------------------------------------------------------------------- #
#                              Bootstrap installer                             #
# ---------------------------------------------------------------------------- #

log "Assuring gulp installed globally..."
if ! [ -x "$(command -v gulp)" ]; then
    log "Gulp not installed. Installing..."
    npm i -g gulp-cli
fi

log "Verifying installer dependencies..."
if ! [ -d "$DIR/node_modules" ]; then
    npm i
fi

log "Dotfiles-installer is ready to rock! Run 'gulp' to begin."
