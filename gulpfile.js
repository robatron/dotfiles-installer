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

// Phase for verifying akinizer prerequisites are installed
const verifyPrereqsPhase = definePhase(
    'verifyPrereqs',
    ACTIONS.VERIFY,
    ['curl', 'git', 'node', 'npm'].map((pkgName) =>
        p(pkgName, { verifyCommandExists: true }),
    ),
    { parallel: true },
);

const installUtilsPhase = definePhase('installUtils', ACTIONS.RUN_PHASES, [
    definePhase('common', ACTIONS.INSTALL, [
        p('cowsay'),
        p('gpg'),
        p('htop'),
        p('jq'),
        p('vim'),
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
                    'ln -sf `which shuf` $HOME/bin/gshuf',
                ],
            }),
        ]),
    isMac() &&
        definePhase('mac', ACTIONS.INSTALL, [
            // Favor GNU utilities over BSD's
            p('coreutils'),
            p('fortune'),
        ]),
]);

const installPythonPhase = definePhase('installPython', ACTIONS.INSTALL, [
    p('python3'),
    p('python3-distutils', {
        // Required for installing `pip`. Only needed on Linux
        skipAction: !isLinux(),
        testFn: (pkg) =>
            !exec(`dpkg -s '${pkg.name}'`, {
                silent: true,
            }).code,
    }),
    p('pip', {
        installCommands: [
            'sudo curl https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py',
            'sudo -H python3 /tmp/get-pip.py',
        ],
    }),
    p('pyenv', {
        installCommands: ['curl https://pyenv.run | bash'],
        testFn: (pkg) =>
            fileExists(path.join(process.env['HOME'], `.${pkg.name}`)),
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
        ].map((name) =>
            p(name, {
                isGUI: true,
            }),
        ),
    );

// Install Docker and make rootless
// See https://docs.docker.com/engine/install/ubuntu/
const installDockerPhase = definePhase('installDocker', ACTIONS.RUN_PHASES, [
    isLinux() &&
        definePhase('linux', ACTIONS.RUN_PHASES, [
            definePhase('prereqs', ACTIONS.INSTALL, [
                p('apt-update', {
                    installCommands: ['sudo apt update'],
                }),
                p('apt-transport-https'),
                p('ca-certificates'),
                p('curl'),
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
                }),
            ]),
            definePhase('rootless-user', ACTIONS.INSTALL, [
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
            definePhase('engine', ACTIONS.INSTALL, [
                'docker-ce',
                'docker-ce-cli',
                'containerd.io',
            ]),
        ]),
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
        // it if we're in a continuous- delivery environment (GitHub Actions)
        skipAction: process.env['CI'],
        testFn: (pkg) => fileExists(dotfilesRepoDir),
    }),
]);

// Create the full gulp task tree from the phase and pakage definitions and
// export them as gulp tasks
createTaskTree(
    defineRoot([
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
