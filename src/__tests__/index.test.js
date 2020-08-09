const gulp = require('gulp');
const {
    ACTIONS,
    createPhaseDef,
    createPhaseTreeDef,
    createPhaseTreeTasks,
    PLATFORM: { IS_LINUX },
} = require('../index');

jest.mock('../packageUtils');
const packageUtils = require('../packageUtils');
const { createPackage } = jest.requireActual('../packageUtils');

jest.mock('gulp');

/**
 * defaultTestPhaseTreeDef is a definition of a phase tree exemplifying
 * thefollowing features:
 *
 * Phase actions:
 *  - INSTALL
 *  - VERIFY
 *  - RUN
 *
 * Phase async:
 *  - parallel
 *  - series (default)
 *
 * Package definitions:
 *  - Command as a string
 *  - Command with options
 *
 * Package args
 *  - All: <arbitrary_arg>, command, skipAction
 *  - VERIFY: testFn
 *  - INSTALL: installCommands, testFn
 */
const installTargets = [
    'alpha',
    [
        'bravo',
        {
            arbitraryInstallArg: 'arbitrary-install-arg',
            command: 'delta-cli',
            installCommands: ['foo', 'bar'],
            skipAction: false,
            testFn: (pkg) => false,
        },
    ],
    [
        'charlie',
        {
            skipAction: true,
        },
    ],
    [
        'delta',
        {
            testFn: (pkg) => true,
        },
    ],
];
const verifyTargets = [
    'echo',
    [
        'foxtrot',
        {
            arbitraryInstallArg: 'arbitrary-install-arg',
            command: 'delta-cli',
            skipAction: false,
            testFn: (pkg) => false,
        },
    ],
    [
        'golf',
        {
            skipAction: true,
        },
    ],
    [
        'hotel',
        {
            testFn: (pkg) => true,
        },
    ],
];
const defaultTestPhaseTreeDef = createPhaseTreeDef([
    createPhaseDef('installPhase', ACTIONS.INSTALL, installTargets),
    createPhaseDef('runPhase', ACTIONS.RUN_PHASES, [
        createPhaseDef('subInstallPhase', ACTIONS.INSTALL, [
            'indiana',
            'juliet',
            'kilo',
        ]),
        createPhaseDef('subVerifyPhase', ACTIONS.VERIFY, [
            'lima',
            'mike',
            'november',
        ]),
    ]),
    createPhaseDef('verifyPhase', ACTIONS.VERIFY, verifyTargets, {
        parallel: true,
    }),
]);

describe('createPhaseTreeTasks', () => {
    gulp.parallel.mockImplementation = (task) => `gulp.parallel(${task})`;
    gulp.series.mockImplementation = (task) => `gulp.series(${task})`;

    packageUtils.createPackage.mockImplementation = (pkgDef, action) => {
        if (typeof pkgDef === 'string') {
            return new Package(pkgDef, { action });
        } else if (Array.isArray(pkgDef)) {
            const pkgName = pkgDef[0];
            const pkgOpts = pkgDef[1];
            return new Package(pkgName, { ...pkgOpts, action });
        } else {
            throw new Error(
                `Malformed package definition: ${JSON.stringify(pkgDef)}`,
            );
        }
    };
    packageUtils.installPackage.mockImplementation = (pkg) =>
        `installPackage(${pkg})`;
    packageUtils.isPackageInstalled.mockImplementation = (pkg) => false;

    it('creates a phase task tree from a phase tree definition', () => {
        const testExports = {};
        createPhaseTreeTasks(defaultTestPhaseTreeDef, testExports);
    });
});
