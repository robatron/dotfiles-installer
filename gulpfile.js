const { series } = require('gulp');
const { assureInstalled, verifyInstalled } = require('./src/assureInstalled');
const { createGlobalLogger } = require('./src/logger');
const { IS_LINUX, IS_MAC } = require('./src/platform');

/*
Bootstrap:
    System package manager
    curl
    Node.js
        - Nvm
        - Node
        - NPM

Python:
    - python3
    - python3-distutils (Linux only)
    - pip
    - envtpl
    - pyenv (mac / linux different)

Dotfiles:
    - yadm
    - dotfiles themselves

Base utils (linux):
    - cowsay
    - fortune-mod
    - gpg
    - zsh
    - gshuf (symlink shuf)

Base utils (mac):
    - caskroom/homebrew-cask (tap)
    - coreutils
    - cowsay
    - fortune
    - gpg
    - pyenv
    - reattach-to-user-namespace
    - tmux
    - zplug

GUI utils (mac):
    - deluge \
    - google-chrome \
    - iterm2 \
    - keepingyouawake \
    - spectacle \
    - vagrant \
    - virtualbox \
    - visual-studio-code

Common utils:
    oh-my-zsh
    spaceship-prompt
    powerline fonts
*/

const TARGET_PROGRAMS = {
    curl: { category: 'prereq' },
    git: { category: 'prereq' },
    node: { category: 'prereq' },
    npm: { category: 'prereq' },
    nvm: { category: 'prereq' },
};

// Init
createGlobalLogger();

// Verify prereq programs are available
const verifyPrereqs = (cb) => {
    let missingPackageCount = 0;

    log.info('Verifying prereqs...');

    Object.keys(TARGET_PROGRAMS)
        .filter((prog) => TARGET_PROGRAMS[prog].category === 'prereq')
        .forEach((packageName) => {
            log.info(`Verifying package "${packageName}" is installed...`);

            if (!verifyInstalled(packageName)) {
                log.error(`❌ Package "${packageName}" is not installed.`);
                ++missingPackageCount;
            }
        });

    if (missingPackageCount) {
        throw new Error(
            `Missing ${missingPackageCount} prereq${
                missingPackageCount !== 1 ? 's' : ''
            }. (See log for details.) Verify you ran the bootstrap script and try again.`,
        );
    }

    cb();
};

// Install Python stuff
function installPython(cb) {
    log.info('Installing base programs...');

    assureInstalled('python3');

    IS_LINUX && assureInstalled('python3-distutils', { shouldInstall: true });

    assureInstalled('pip', {
        installCommands: [
            'sudo curl https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py',
            'sudo -H python3 /tmp/get-pip.py',
        ],
    });

    // Required by yadm
    assureInstalled('envtpl', {
        installCommands: ['sudo -H pip install envtpl'],
    });

    cb();
}

exports.verifyPrereqs = verifyPrereqs;
exports.default = series(verifyPrereqs);
