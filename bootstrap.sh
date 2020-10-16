#! /usr/bin/env bash

# This is the BOOTSTRAPPER script that installs system programs and dependencies
# required to apply akinizer configurations

set -e # Exit on any error

# ------------------------------------------------------------------------------
# Settings
# ------------------------------------------------------------------------------

# Which ref to checkout after installing Akinizer. Defaults to `master`
AK_GIT_REF=${AK_GIT_REF:-master}

# Where to install Akinizer. Defaults to `$HOME/opt/akinizer`
AK_INSTALL_ROOT=${AK_INSTALL_ROOT:-$HOME/opt/akinizer}

# Optionally skip cloning the Akinizer repo
AK_SKIP_CLONE=${AK_SKIP_CLONE:-no}

# ------------------------------------------------------------------------------
# Constants, helper functions
# ------------------------------------------------------------------------------

ORIG_CWD="$(pwd)"
PLATFORM=$(uname -s)
AK_REPO_URL="https://github.com/robatron/akinizer.git"

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

# ------------------------------------------------------------------------------
# Bootstrap system
# ------------------------------------------------------------------------------

log "Bootstrapping Akinizer w/ these settings:"
log "    AK_GIT_REF:      $AK_GIT_REF"
log "    AK_INSTALL_ROOT: $AK_INSTALL_ROOT"
log "    AK_REPO_URL:     $AK_REPO_URL"
log "    AK_SKIP_CLONE:   $AK_SKIP_CLONE"
log "    ORIG_CWD:        $ORIG_CWD"
log "    PLATFORM:        $PLATFORM"

log "Looking for system target managers and base programs..."

if [ "$PLATFORM" = "Darwin" ]; then
    log "Mac OS X detected. Looking for brew..."

    if ! [ -x "$(command -v brew)" ]; then
        log "Homebrew missing. Installing homebrew..."
        /usr/bin/ruby -e \
            "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    fi

    assure_installed_mac curl
    assure_installed_mac git

elif [ "$PLATFORM" = "Linux" ]; then
    log "Linux detected. Looking for apt..."

    if ! [ -x "$(command -v apt)" ]; then
        logw  "apt isn't available and I don't know what to do :-("
        exit 1
    fi

    assure_installed_linux curl
    assure_installed_linux git
fi

# ------------------------------------------------------------------------------
# Bootstrap Node.js
# ------------------------------------------------------------------------------

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

log "Assuring gulp installed globally..."
if ! [ -x "$(command -v gulp)" ]; then
    log "Gulp not installed. Installing..."
    npm i -g gulp-cli
fi

# ------------------------------------------------------------------------------
# Install Akinizer itself
# ------------------------------------------------------------------------------

# TODO: Publish and install via NPM

if ! [ $AK_SKIP_CLONE = yes ]; then
    log "Cloning Akinizer..."

    mkdir -p $(dirname $AK_INSTALL_ROOT)
    cd $(dirname $AK_INSTALL_ROOT)

    if ! [ -d $(basename $AK_INSTALL_ROOT) ]; then
        git clone $AK_REPO_URL $AK_INSTALL_ROOT
        cd $AK_INSTALL_ROOT
        git checkout $AK_GIT_REF
    else
        log "Akinizer was NOT installed b/c the target directory exists: $AK_INSTALL_ROOT"
    fi
else
    log "Akinizer clone skipped: AK_SKIP_CLONE == yes"
fi

log "Installing Akinizer dependencies..."
if ! [ -d "$AK_INSTALL_ROOT/node_modules" ]; then
    cd $AK_INSTALL_ROOT
    npm i
else
    log "Akinizer deps are already installed"
fi

log "Akinizer is ready to rock! Run 'gulp' in the same directory as your Akinizer gulpfile."
