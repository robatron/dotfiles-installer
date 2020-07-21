const { fileExists } = require('./src/fileUtils');
const path = require('path');
const { exec } = require('shelljs');
const {
    ACTIONS,
    PLATFORM: { IS_LINUX },
} = require('./src/constants');

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

const old = [
    [
        // Prereq packages to verify first
        'prereq',
        {
            asyncType: 'parallel',
            packageActon: 'verify',
            packages: [
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
                                        path.join(
                                            process.env['HOME'],
                                            `.${pkg.name}`,
                                        ),
                                    `${pkg.name}.sh`,
                                ),
                            ),
                    },
                ],
            ],
        },
    ],
    [
        // Python packages
        'python',
        {
            asyncType: 'series',
            packageActon: 'install',
            packages: [
                'python3',
                [
                    // Distutils required for installing `pip`. Only need to install
                    // on Linux
                    'python3-distutils',
                    {
                        skipInstall: !IS_LINUX,
                        testFn: (pkg) =>
                            !exec(`dpkg -s '${pkg.name}'`, { silent: true })
                                .code,
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
            ],
        },
    ],
];

/*
    - Package: Single thing to act apon (verify, install, etc.)
    - Phase: An action to be performed on a set of packages
    - Phases: A set of phases
*/

module.exports = {
    action: ACTIONS.RUN_PHASES,

    // Run tasks in parallel? (Serial by default)
    parallel: false,

    // Run these
    targets: [
        [
            'verifyPrereqs',
            {
                action: ACTIONS.VERIFY,
                parallel: true,
                targets: [
                    'curl',
                    'git',
                    'node',
                    'npm',
                    [
                        'nvm',
                        {
                            actionFn: (pkg) =>
                                fileExists(
                                    path.join(
                                        process.env['NVM_DIR'] ||
                                            path.join(
                                                process.env['HOME'],
                                                `.${pkg.name}`,
                                            ),
                                        `${pkg.name}.sh`,
                                    ),
                                ),
                        },
                    ],
                ],
            },
        ],
    ],
};
