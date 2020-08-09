const path = require('path');
const gulp = require('gulp');
const {
    ACTIONS,
    createPhaseDef,
    createPhaseDefTreeRoot,
    createPhaseTaskTree,
    fileExists,
    PLATFORM: { IS_LINUX },
} = require('../index');
const taskUtils = require('../taskUtils');

jest.mock('../packageUtils');
jest.mock('gulp');

const defaultTestTargets = [
    // String targets
    'curl',
    'git',
    'node',
    'npm',

    // Targets with metadata
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

describe('createPhaseTaskTree', () => {
    it('creates a phase task tree from a phase tree definition', () => {
        // TODO
    });
});
