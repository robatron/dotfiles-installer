/**
 * This is the example snippet from the README.
 */
const { homedir } = require('os');
const path = require('path');
const {
    ACTIONS,
    createTaskTree,
    defineTarget: t,
    definePhase,
    defineRoot,
    fileExists,
    isLinux,
    isMac,
} = require('akinizer');

// Define a "verify" phase: Verify packages are installed.
const verifyPrereqsPhase = definePhase(
    // Phase name. This can be run individually with `gulp verifyPrereqs`
    'verifyPrereqs',

    // For every target, apply the `VERIFY_PACKAGES` action
    ACTIONS.VERIFY_PACKAGES,

    // List of packages to be verified
    ['curl', 'git', 'node', 'npm'],

    {
        // Apply these `targetOpts` options to all of this phase's packages.
        // The `verifyCommandExists` option verifies the *command* exists
        // instead of verifying the target exists with the system manager.
        targetOpts: {
            verifyCommandExists: true,
        },

        // We can run the phase in parallel b/c target verifications are
        // independent from each other
        parallel: true,
    },
);

// Define an "install utilities" parent phase where we run child phases to
// install utility packages.
const installUtilsPhase = definePhase('installUtils', ACTIONS.RUN_PHASES, [
    definePhase('common', ACTIONS.INSTALL_PACKAGES, [
        'cowsay',
        'gpg',
        'htop',
        'jq',
        'vim',
    ]),

    // Define this phase only for Linux. In this case, `fortune-mod` is the
    // Linux-specific name for this package.
    isLinux() &&
        definePhase('linux', ACTIONS.INSTALL_PACKAGES, [t('fortune-mod')]),

    // Define this phase only for macOS. In this case, `fortune` is the
    // macOS-specific name for this package.
    isMac() &&
        definePhase('mac', ACTIONS.INSTALL_PACKAGES, [
            // Favor GNU utilities over BSD's
            'coreutils',
            'fortune',
        ]),
]);

// Define an "install python"
const installPythonPhase = definePhase(
    'installPython',
    ACTIONS.INSTALL_PACKAGES,
    [
        t('python3'),
        t('python3-distutils', {
            // Required for installing `pip`. Only needed on Linux
            skipAction: () => !isLinux(),
        }),
        t('pip', {
            // Pip canot be installed via the default system package manager, so
            // it needs to run a custom install command instead
            actionCommands: [
                'sudo curl https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py',
                'sudo -H python3 /tmp/get-pip.py',
            ],
        }),
    ],
);

// Define an "install terminal" phase where we install terminal-related packages
const OMZDir = path.join(homedir(), '.oh-my-zsh');
const SpaceshipThemeDir = path.join(OMZDir, 'themes', 'spaceship-prompt');
const installTermPhase = definePhase('installTerm', ACTIONS.INSTALL_PACKAGES, [
    t('zsh'),
    t('oh-my-zsh', {
        actionCommands: [
            `curl https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh -o /tmp/omzshinstall.sh`,
            `RUNZSH=no sh /tmp/omzshinstall.sh`,
        ],
        skipAction: () => fileExists(OMZDir),
        skipActionMessage: () => `File exists: ${OMZDir}`,
    }),

    // Install the "spaceship-prompt" directly from a git repository specifying
    // its repo, checkout ref, destination (clone) directory, and an automatic
    // simlink to create
    t('spaceship-prompt', {
        gitPackage: {
            binDir: `${OMZDir}/themes/spaceship.zsh-theme`,
            binSymlink: 'spaceship.zsh-theme',
            cloneDir: SpaceshipThemeDir,
            ref: 'c38183d654c978220ddf123c9bdb8e0d3ff7e455',
            repoUrl: 'https://github.com/denysdovhan/spaceship-prompt.git',
        },
        skipAction: () => fileExists(SpaceshipThemeDir),
        skipActionMessage: () => `File exists: ${SpaceshipThemeDir}`,
    }),
]);

// Define a macOS-only "GUI app install" phase where GUI apps are installed
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

// Create the full gulp task tree from the phase and pakage definitions above,
// and export them as runnable gulp tasks
createTaskTree(
    defineRoot([
        verifyPrereqsPhase,
        installUtilsPhase,
        installPythonPhase,
        installTermPhase,
        installMacGuiAppsPhase,
    ]),
    exports,
);
