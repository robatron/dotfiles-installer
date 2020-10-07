/**
 * This file serves as an end-to-end test for akinizer, in addition to being my
 * personal akinizer configuration
 */
const os = require('os');
const path = require('path');
const { exec } = require('shelljs');
const {
    ACTIONS,
    createTaskTree,
    definePackage: p,
    definePhase,
    defineRoot,
    fileExists,
    getConfig,
    isLinux,
    isMac,
} = require('.');

const { binInstallDir, gitCloneDir } = getConfig();

// Define phases. In this phase, we're verifying packages are installed.
const verifyPrereqsPhase = definePhase(
    // Phase name. This can be run with `gulp verifyPrereqs`
    'verifyPrereqs',

    // For every package, apply the `VERIFY` action
    ACTIONS.VERIFY,

    // List of packages to be verified
    ['curl', 'git', 'node', 'npm'],

    {
        // Apply these options to all of this phase's packages
        packageOpts: {
            // This option verifies the command exists instead of verifying
            // its package exists with the system package manager
            verifyCommandExists: true,
        },

        // We can run the phase in parallel b/c package verifications are
        // independent from each other
        parallel: true,
    },
);

// Make sure apt is up-to-date on Linux
const updateApt = definePhase('updateApt', ACTIONS.INSTALL, [
    p('apt-update', {
        forceAction: true,
        installCommands: ['sudo apt update'],
        skipAction: !isLinux(),
    }),
]);

const gshufPath = path.join(os.homedir(), 'bin', 'gshuf');
const installUtilsPhase = definePhase('installUtils', ACTIONS.RUN_PHASES, [
    definePhase('common', ACTIONS.INSTALL, [
        'cowsay',
        'gpg',
        'htop',
        'jq',
        'vim',
    ]),
    isLinux() &&
        definePhase('linux', ACTIONS.INSTALL, [
            // Linux version of fortune
            p('fortune-mod'),

            // Symlink shuf to gshuf on Linux to normalize 'shuffle' command
            // between Linux and Mac
            p('gshuf', {
                installCommands: [
                    `mkdir -p $HOME/bin/`,
                    `ln -sf \`which shuf\` ${gshufPath}`,
                ],
                testFn: (pkg) => fileExists(gshufPath),
            }),
        ]),
    isMac() &&
        definePhase('mac', ACTIONS.INSTALL, [
            // Favor GNU utilities over BSD's
            'coreutils',
            'fortune',
        ]),
]);

const installPythonPhase = definePhase('installPython', ACTIONS.INSTALL, [
    p('python3'),
    p('python3-distutils', {
        // Required for installing `pip`. Only needed on Linux
        skipAction: !isLinux(),
    }),
    p('pip', {
        installCommands: [
            'sudo curl https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py',
            'sudo -H python3 /tmp/get-pip.py',
        ],
    }),
    p('pyenv', {
        installCommands: ['curl https://pyenv.run | bash'],
        testFn: (pkg) => fileExists(path.join(os.homedir(), `.${pkg.name}`)),
    }),
    p('envtpl', {
        // Required for `yadm`
        installCommands: ['sudo -H pip install envtpl'],
    }),
]);

const OMZDir = path.join(os.homedir(), '.oh-my-zsh');
const SpaceshipThemeDir = path.join(OMZDir, 'themes', 'spaceship-prompt');
const powerlineDir = path.join(gitCloneDir, 'powerline');
const installTermPhase = definePhase('installTerm', ACTIONS.INSTALL, [
    p('zsh'),
    p('oh-my-zsh', {
        installCommands: [
            `wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O /tmp/omzshinstall.sh`,
            `RUNZSH=no sh /tmp/omzshinstall.sh`,
        ],
        testFn: (pkg) => fileExists(OMZDir),
    }),
    p('spaceship-prompt', {
        gitPackage: {
            binDir: `${OMZDir}/themes/spaceship.zsh-theme`,
            binSymlink: 'spaceship.zsh-theme',
            cloneDir: SpaceshipThemeDir,
            repoUrl: 'https://github.com/denysdovhan/spaceship-prompt.git',
        },
        testFn: (pkg) => fileExists(SpaceshipThemeDir),
    }),
    p('powerline', {
        gitPackage: {
            cloneDir: powerlineDir,
            repoUrl: 'https://github.com/powerline/fonts.git',
        },
        postInstall: (pkg) => {
            const cmds = [
                `mkdir -p $HOME/.local`,
                `sudo chown -R $USER: $HOME/.local`,
                `${powerlineDir}/install.sh`,
            ].join(' && ');

            const err = exec(cmds).code;

            if (err) {
                throw new Error(`Post-install commands failed: ${cmds}`);
            }
        },
        testFn: (pkg) => fileExists(powerlineDir),
    }),

    p('tmux'),
    p('reattach-to-user-namespace', {
        // Mac only. Required for tmux to interface w/ OS X clipboard, etc.
        skipAction: !isMac(),
    }),
]);

const installMacGuiAppsPhase =
    isMac() &&
    definePhase(
        'installMacGuiApps',
        ACTIONS.INSTALL,
        [
            'deluge',
            'google-chrome',
            'iterm2',
            'keepingyouawake',
            'spectacle',
            'visual-studio-code',
        ],
        {
            packageOpts: {
                isGui: true,
            },
        },
    );

const installDockerPhase = definePhase('installDocker', ACTIONS.RUN_PHASES, [
    // Install Docker for Linux
    isLinux() &&
        definePhase('linux', ACTIONS.RUN_PHASES, [
            definePhase('prereqs', ACTIONS.INSTALL, [
                p('apt-transport-https'),
                p('ca-certificates'),
                p('gnupg-agent'),
                p('software-properties-common'),
                p('docker-apt-key', {
                    installCommands: [
                        `curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -`,
                        `sudo add-apt-repository \
                                "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
                                $(lsb_release -cs) \
                                stable"`,
                        'sudo apt update',
                    ],
                    forceAction: true,
                }),
            ]),

            // Install engine in separate phase b/c it's apt-based
            definePhase('engine', ACTIONS.INSTALL, [
                'docker-ce',
                'docker-ce-cli',
                'containerd.io',
            ]),

            // Allow docker to be managed without `sudo`. Only relevant for Linux. See
            // https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user
            definePhase('configureDockerRootlessMode', ACTIONS.INSTALL, [
                p('add-docker-group', {
                    installCommands: ['sudo groupadd docker'],
                    testFn: (pkg) => {
                        // Does the docker group exist on the system?
                        const groups = exec('getent group')
                            .stdout.split('\n')
                            .map((group) => group.split(':')[0]);
                        return groups.includes('docker');
                    },
                }),
                p('add-user-to-docker-group', {
                    installCommands: ['sudo usermod -aG docker $USER'],
                    testFn: (pkg) => {
                        // Does the user belong to the docker group?
                        const groups = exec('groups').stdout.split(' ');
                        return groups.includes('docker');
                    },
                }),
            ]),

            // Verify we can run Docker (and without `sudo`)
            definePhase('verifyDocker', ACTIONS.VERIFY, [
                p('rootless-docker', {
                    testFn: (pkg) => !exec(`docker run hello-world`).code,
                }),
            ]),
        ]),

    // Install Docker for Mac. We can't configure or verify it since its a
    // GUI app, so installation is much simpler than for Linux.
    isMac() &&
        definePhase('mac', ACTIONS.INSTALL, [p('docker', { isGUI: true })]),
]);

const dotfilesRepoDir = path.join(os.homedir(), '.yadm');
const dotfilesRepoUrl = 'https://robatron@bitbucket.org/robatron/dotfiles.git';
const installDotfilesPhase = definePhase('installDotfiles', ACTIONS.INSTALL, [
    p('yadm', {
        gitPackage: {
            binSymlink: 'yadm',
            repoUrl: 'https://github.com/TheLocehiliosan/yadm.git',
        },
    }),
    p('dotfiles', {
        installCommands: [
            `${path.join(binInstallDir, 'yadm')} clone ${dotfilesRepoUrl}`,
        ],
        // This step requires user interaction (entering a password), so skip
        // it if we're in a continuous-delivery environment (GitHub Actions)
        skipAction: process.env['CI'],
        testFn: (pkg) => fileExists(dotfilesRepoDir),
    }),
]);

// Create the full gulp task tree from the phase and pakage definitions and
// export them as gulp tasks
createTaskTree(
    // Define the task tree root consisting of phases
    defineRoot([
        updateApt,
        verifyPrereqsPhase,
        installUtilsPhase,
        installPythonPhase,
        installTermPhase,
        installMacGuiAppsPhase,
        installDockerPhase,
        installDotfilesPhase,
    ]),
    exports,
);
