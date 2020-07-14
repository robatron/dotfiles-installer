const { series } = require('gulp');
const path = require('path');
const { exec } = require('shelljs');
const { installPackage, isPackageInstalled } = require('./src/assureInstalled');
const { fileExists } = require('./src/fileUtils');
const { createGlobalLogger } = require('./src/logger');
const Package = require('./src/Package');
const { IS_LINUX } = require('./src/platform');
const { createInstallTasks, createVerifyTasks } = require('./src/taskUtils');

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

// Prereq commands to verify
const PREREQ_PACKAGES = [
    'curl',
    'git',
    'node',
    'npm',
    [
        'nvm',
        {
            testFn: (pkg) =>
                fileExists(
                    path.join(
                        process.env['NVM_DIR'] ||
                            path.join(process.env['HOME'], `.${pkg.name}`),
                        `${pkg.name}.sh`,
                    ),
                ),
        },
    ],
];

const PYTHON_PACKAGES = [
    'python3',
    [
        // Distutils required for installing `pip`. Only need to install
        // on Linux
        'python3-distutils',
        {
            skipInstall: !IS_LINUX,
            testFn: (pkg) =>
                !exec(`dpkg -s '${pkg.name}'`, { silent: true }).code,
        },
    ],
    [
        'pip',
        {
            installCommands: [
                'sudo curl https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py',
                'sudo -H python3 /tmp/get-pip.py',
            ],
        },
    ],
    [
        // Required for `yadm`
        'envtpl',
        {
            installCommands: ['sudo -H pip install envtpl'],
        },
    ],
    [
        'pyenv',
        {
            installCommands: ['curl https://pyenv.run | bash'],
            testFn: (pkg) =>
                fileExists(
                    path.join(
                        process.env['HOME'],
                        `.${pkg.name}`,
                        'bin',
                        `${pkg.name}`,
                    ),
                ),
        },
    ],
];

exports.verifyPrereqPackages = series(createVerifyTasks(PREREQ_PACKAGES));
exports.installPythonPackages = series(createInstallTasks(PYTHON_PACKAGES));

exports.default = series(
    exports.verifyPrereqPackages,
    exports.installPythonPackages,
);
