const path = require('path');
const { exec } = require('shelljs');
const {
    createTaskTree,
    fileExists,
    ACTIONS,
    PLATFORM: { IS_LINUX },
    defineTaskPhase,
    defineTaskTreeRoot,
} = require('.');

// Package tree phase definition
const taskTreeRoot = defineTaskTreeRoot([
    defineTaskPhase(
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
        { parallel: true },
    ),
    defineTaskPhase('installPythonPhase', ACTIONS.INSTALL, [
        'python3',
        [
            // Required for installing `pip`. Only needed on Linux
            'python3-distutils',
            {
                skipAction: !IS_LINUX,
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
    ]),
]);

// Create the full gulp task tree from the package definitions and export them
// as gulp tasks
createTaskTree(taskTreeRoot, exports);
