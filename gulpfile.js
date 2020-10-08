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

    // For every target, apply the `VERIFY_PACKAGES` action
    ACTIONS.VERIFY_PACKAGES,

    // List of packages to be verified
    ['curl', 'git', 'node', 'npm'],

    {
        // Apply these options to all of this phase's packages
        targetOpts: {
            // This option verifies the command exists instead of verifying
            // its target exists with the system target manager
            verifyCommandExists: true,
        },

        // We can run the phase in parallel b/c target verifications are
        // independent from each other
        parallel: true,
    },
);

// Make sure apt is up-to-date on Linux
const updateApt = definePhase('updateApt', ACTIONS.EXECUTE_JOBS, [
    p('apt-update', {
        actionCommands: ['sudo apt update'],
        skipAction: () => !isLinux(),
    }),
]);

const gshufPath = path.join(os.homedir(), 'bin', 'gshuf');
const installUtilsPhase = definePhase('installUtils', ACTIONS.RUN_PHASES, [
    definePhase('common', ACTIONS.INSTALL_PACKAGES, [
        'cowsay',
        'gpg',
        'htop',
        'jq',
        'vim',
    ]),
    isLinux() &&
        definePhase('linux', ACTIONS.INSTALL_PACKAGES, [
            // Linux version of fortune
            p('fortune-mod'),

            // Symlink shuf to gshuf on Linux to normalize 'shuffle' command
            // between Linux and Mac
            p('gshuf', {
                actionCommands: [
                    `mkdir -p $HOME/bin/`,
                    `ln -sf \`which shuf\` ${gshufPath}`,
                ],
                skipAction: () => fileExists(gshufPath),
                skipActionMessage: () => `File already exists: ${gshufPath}`,
            }),
        ]),
    isMac() &&
        definePhase('mac', ACTIONS.INSTALL_PACKAGES, [
            // Favor GNU utilities over BSD's
            'coreutils',
            'fortune',
        ]),
]);

const pyenvDir = path.join(os.homedir(), `.pyenv`);
const installPythonPhase = definePhase(
    'installPython',
    ACTIONS.INSTALL_PACKAGES,
    [
        p('python3'),
        p('python3-distutils', {
            // Required for installing `pip`. Only needed on Linux
            skipAction: () => !isLinux(),
        }),
        p('pip', {
            actionCommands: [
                'sudo curl https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py',
                'sudo -H python3 /tmp/get-pip.py',
            ],
        }),
        p('pyenv', {
            actionCommands: ['curl https://pyenv.run | bash'],
            skipAction: () => fileExists(pyenvDir),
            skipActionMessage: () => `File exists: ${pyenvDir}`,
        }),
        p('envtpl', {
            // Required for `yadm`
            actionCommands: ['sudo -H pip install envtpl'],
        }),
    ],
);

const OMZDir = path.join(os.homedir(), '.oh-my-zsh');
const SpaceshipThemeDir = path.join(OMZDir, 'themes', 'spaceship-prompt');
const powerlineDir = path.join(gitCloneDir, 'powerline');
const installTermPhase = definePhase('installTerm', ACTIONS.INSTALL_PACKAGES, [
    p('zsh'),
    p('oh-my-zsh', {
        actionCommands: [
            `wget https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O /tmp/omzshinstall.sh`,
            `RUNZSH=no sh /tmp/omzshinstall.sh`,
        ],
        skipAction: () => fileExists(OMZDir),
        skipActionMessage: () => `File exists: ${OMZDir}`,
    }),
    p('spaceship-prompt', {
        gitPackage: {
            binDir: `${OMZDir}/themes/spaceship.zsh-theme`,
            binSymlink: 'spaceship.zsh-theme',
            cloneDir: SpaceshipThemeDir,
            repoUrl: 'https://github.com/denysdovhan/spaceship-prompt.git',
        },
        skipAction: () => fileExists(SpaceshipThemeDir),
        skipActionMessage: () => `File exists: ${SpaceshipThemeDir}`,
    }),
    p('powerline', {
        gitPackage: {
            cloneDir: powerlineDir,
            repoUrl: 'https://github.com/powerline/fonts.git',
        },
        postInstall: () => {
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
        skipAction: () => fileExists(powerlineDir),
        skipActionMessage: () => `File exists: ${powerlineDir}`,
    }),

    p('tmux'),
    p('reattach-to-user-namespace', {
        // Mac only. Required for tmux to interface w/ OS X clipboard, etc.
        skipAction: () => !isMac(),
    }),
]);

const installMacGuiAppsPhase =
    isMac() &&
    definePhase(
        'installMacGuiApps',
        ACTIONS.INSTALL_PACKAGES,
        [
            'deluge',
            'google-chrome',
            'iterm2',
            'keepingyouawake',
            'spectacle',
            'visual-studio-code',
        ],
        {
            targetOpts: {
                isGUI: true,
            },
        },
    );

const installDockerPhase = definePhase('installDocker', ACTIONS.RUN_PHASES, [
    // Install Docker for Linux
    isLinux() &&
        definePhase('linux', ACTIONS.RUN_PHASES, [
            definePhase('prereqs', ACTIONS.INSTALL_PACKAGES, [
                p('apt-transport-https'),
                p('ca-certificates'),
                p('gnupg-agent'),
                p('software-properties-common'),
                p('docker-apt-key', {
                    actionCommands: [
                        `curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -`,
                        `sudo add-apt-repository \
                                "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
                                $(lsb_release -cs) \
                                stable"`,
                        'sudo apt update',
                    ],
                    forceAction: () => true,
                }),
            ]),

            // Install engine in separate phase b/c it's apt-based
            definePhase('engine', ACTIONS.INSTALL_PACKAGES, [
                'docker-ce',
                'docker-ce-cli',
                'containerd.io',
            ]),

            // Allow docker to be managed without `sudo`. Only relevant for Linux. See
            // https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user
            definePhase('configureDockerRootlessMode', ACTIONS.EXECUTE_JOBS, [
                p('add-docker-group', {
                    actionCommands: ['sudo groupadd docker'],
                    skipAction: () => {
                        const groups = exec('getent group', { silent: true })
                            .stdout.split('\n')
                            .map((group) => group.split(':')[0]);
                        return groups.includes('docker');
                    },
                    skipActionMessage: (target) =>
                        'Docker group already exists on system',
                }),
                p('add-group-membership', {
                    actionCommands: ['sudo usermod -aG docker $USER'],
                    skipAction: () => {
                        // Does the user belong to the docker group?
                        const groups = exec('groups', { silent: true }).stdout;
                        return /\bdocker\b/gi.test(groups);
                    },
                    skipActionMessage: () =>
                        `User '${
                            os.userInfo().username
                        }' already belongs to 'docker' group`,
                }),
            ]),

            // Verify we can run Docker (and without `sudo`)
            definePhase('verifyDocker', ACTIONS.VERIFY_PACKAGES, [
                p('rootless-docker', {
                    skipAction: () => !exec(`docker run hello-world`).code,
                    skipActionMessage: () => 'Docker runs without sudo',
                }),
            ]),
        ]),

    // Install Docker for Mac. We can't configure or verify it since its a
    // GUI app, so installation is much simpler than for Linux.
    isMac() &&
        definePhase('mac', ACTIONS.INSTALL_PACKAGES, [
            p('docker', { isGUI: true }),
        ]),
]);

const dotfilesRepoDir = path.join(os.homedir(), '.yadm');
const dotfilesRepoUrl = 'https://robatron@bitbucket.org/robatron/dotfiles.git';
const installDotfilesPhase = definePhase(
    'installDotfiles',
    ACTIONS.INSTALL_PACKAGES,
    [
        p('yadm', {
            gitPackage: {
                binSymlink: 'yadm',
                repoUrl: 'https://github.com/TheLocehiliosan/yadm.git',
            },
        }),
        p('dotfiles', {
            actionCommands: [
                `${path.join(binInstallDir, 'yadm')} clone ${dotfilesRepoUrl}`,
            ],
            skipAction: () =>
                // This step requires user interaction (entering a password), so skip
                // it if we're in a continuous-delivery environment (GitHub Actions)
                process.env['CI'] || fileExists(dotfilesRepoDir),
            skipActionMessage: () => {
                if (process.env['CI']) {
                    return 'In non-interactive environment';
                } else if (fileExists) {
                    return 'File exists: ' + dotfilesRepoDir;
                }
                return 'Unknown reason';
            },
        }),
    ],
);

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
