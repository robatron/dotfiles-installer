const { accessSync } = require('fs');
const { series } = require('gulp');
const path = require('path');
const { exec } = require('shelljs');
const { installPackage, isPackageInstalled } = require('./src/assureInstalled');
const { createGlobalLogger } = require('./src/logger');
const Package = require('./src/Package');

// Init
createGlobalLogger();

/* -------------------------------------------------------------------------- */
/*                             Package definitions                            */
/* -------------------------------------------------------------------------- */

/*
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

Common:
    oh-my-zsh
    spaceship-prompt
    powerline fonts

GUI utils (mac):
    - deluge \
    - google-chrome \
    - iterm2 \
    - keepingyouawake \
    - spectacle \
    - vagrant \
    - virtualbox \
    - visual-studio-code
*/

// Prereq commands to verify before starting
const PREREQ_PACKAGES = [
    new Package('curl'),
    new Package('git'),
    new Package('node'),
    new Package('npm'),
    new Package('nvm', {
        testFn: (pkg) => {
            const nvmBinPath = path.join(
                process.env['NVM_DIR'] || `${process.env['HOME']}/.${pkg.name}`,
                `${pkg.name}.sh`,
            );

            log.info(
                `Custom test for '${pkg.name}': Looking for '${nvmBinPath}'`,
            );

            try {
                accessSync(nvmBinPath);
                console.log('>>> exists');
                return true;
            } catch (err) {
                console.log('>>> does not exist');
                return false;
            }
        },
    }),
];

// Python packages to assure are installed
const PYTHON_PACKAGES = [
    new Package('python3'),
    new Package('pip', {
        installCommands: [
            'sudo curl https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py',
            'sudo -H python3 /tmp/get-pip.py',
        ],
    }),
    new Package('envtpl', {
        installCommands: ['sudo -H pip install envtpl'],
    }),
    new Package('pyenv', {
        installCommands: ['curl https://pyenv.run | bash'],
    }),
];

/* -------------------------------------------------------------------------- */
/*                                    Tasks                                   */
/* -------------------------------------------------------------------------- */

// Verify prereq packages are available
const verifyPrereqPackages = (cb) => {
    log.info('Verifying prereq packages...');

    const missingPackages = [];

    PREREQ_PACKAGES.forEach((pkg) => {
        log.info(`Verifying "${pkg.name}" is installed...`);

        if (!isPackageInstalled(pkg, pkg.meta.testFn)) {
            log.warn(`❌ Package "${pkg.name}" is not installed.`);
            missingPackages.push(pkg.name);
        }
    });

    const missingPkgCount = missingPackages.length;
    if (missingPkgCount) {
        throw new Error(
            `Missing ${missingPkgCount} prereq${
                missingPkgCount !== 1 ? 's' : ''
            }: ${JSON.stringify(missingPackages)} Have you run bootstrap.sh?`,
        );
    }

    cb();
};

// Install Python stuff
function assurePythonPackages(cb) {
    log.info('Assuring Python packages...');

    const installErrorCount = 0;

    PYTHON_PACKAGES.forEach((pkg) => {
        log.info(`Verifying '${pkg.name}' is installed...`);

        if (!isPackageInstalled(pkg)) {
            log.info(`Package '${pkg.name}' is not installed. Installing...`);
            const installError = installPackage(pkg);

            if (installError) {
                log.warn(installError);
                ++installErrorCount;
            }
        }
    });

    if (installErrorCount) {
        throw new Error(`There were error(s) installing Python packages.`);
    }

    cb();
}

exports.verifyPrereqPackages = verifyPrereqPackages;
exports.assurePythonPackages = assurePythonPackages;

exports.default = series(verifyPrereqPackages, assurePythonPackages);
