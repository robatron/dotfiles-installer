/**
 * This file serves as an end-to-end test for akinizer, in addition to being my
 * personal akinizer definition
 */
const os = require('os');
const path = require('path');
const { exec } = require('shelljs');
const {
    ACTIONS,
    createTaskTree,
    definePhase,
    defineRoot,
    getConfig,
    fileExists,
    isLinux,
} = require('.');

const { binInstallDir } = getConfig();
const dotfilesRepoDir = path.join(os.homedir(), '.yadm');
const dotfilesRepoUrl = 'https://robatron@bitbucket.org/robatron/dotfiles.git';

// Test phase definitions
const verifyPrereqsPhase = definePhase(
    'verifyPrereqsPhase',
    ACTIONS.VERIFY,
    [
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
    ],
    { parallel: true },
);

const installPythonPhase = definePhase('installPythonPhase', ACTIONS.INSTALL, [
    'python3',
    [
        // Required for installing `pip`. Only needed on Linux
        'python3-distutils',
        {
            skipAction: !isLinux(),
            testFn: (pkg) =>
                !exec(`dpkg -s '${pkg.name}'`, {
                    silent: true,
                }).code,
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
    [
        // Required for `yadm`
        'envtpl',
        {
            installCommands: ['sudo -H pip install envtpl'],
        },
    ],
]);

const installDotfilesPhase = definePhase(
    'installDotfilesPhase',
    ACTIONS.INSTALL,
    [
        [
            'yadm',
            {
                gitPackage: {
                    binSymlink: 'yadm',
                    repoUrl: 'https://github.com/TheLocehiliosan/yadm.git',
                },
            },
        ],
        [
            'dotfiles',
            {
                installCommands: [
                    `${path.join(
                        binInstallDir,
                        'yadm',
                    )} clone ${dotfilesRepoUrl}`,
                ],
                // This step requires user interaction (entering a
                // password), so skip it if we're in a continuous-
                // delivery environment (GitHub Actions)
                skipAction: process.env['CI'],
                testFn: (pkg) => fileExists(dotfilesRepoDir),
            },
        ],
    ],
);

// Create the full gulp task tree from the phase and pakage definitions and
// export them as gulp tasks
createTaskTree(
    defineRoot([
        // verifyPrereqsPhase,
        // installPythonPhase,
        installDotfilesPhase,
    ]),
    exports,
);
