const { series, parallel } = require('gulp');
const PACKAGES = require('./PACKAGES');
const { createGlobalLogger } = require('./src/logger');

const { createTask } = require('./src/taskUtils');
const { createPackage } = require('./src/packageUtils');

// Init
createGlobalLogger();

const verifyPackages = [
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
]
    .map((pkgDef) => createPackage(pkgDef, 'verify'))
    .map((pkg) => createTask(pkg, exports));

exports.verifyPhase = parallel(verifyPackages);

exports.default = series(exports.verifyPhase);
