const gulp = require('gulp');
const {
    ACTIONS,
    createPhaseDef,
    createPhaseTreeDef,
    createPhaseTreeTasks,
    PLATFORM: { IS_LINUX },
} = require('../index');
const taskUtils = require('../taskUtils');
const packageUtils = require('../packageUtils');

jest.mock('gulp');
jest.mock('../packageUtils');

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
    beforeEach(() => {
        ['parallel', 'series'].forEach((asyncType) => {
            gulp[asyncType] = jest.fn((tasks) => {
                return {
                    asyncType,
                    displayName: null,
                    tasks: tasks.map((task) =>
                        typeof task === 'function' ? 'task-fn' : task,
                    ),
                };
            });
        });

        packageUtils.installPackage.mockImplementation = (pkg) =>
            `installPackage(${pkg})`;
        packageUtils.isPackageInstalled.mockImplementation = (pkg) => false;
    });

    it('exposes all tasks globally', () => {
        const testExports = {};
        createPhaseTreeTasks(defaultTestPhaseTreeDef, testExports);
        [
            'default',
            'installPhase:install:alpha',
            'installPhase:install:bravo',
            'installPhase:install:charlie',
            'installPhase:install:delta',
            'installPhase',
            'runPhase',
            'subInstallPhase:install:indiana',
            'subInstallPhase:install:juliet',
            'subInstallPhase:install:kilo',
            'subInstallPhase',
            'subVerifyPhase:verify:lima',
            'subVerifyPhase:verify:mike',
            'subVerifyPhase:verify:november',
            'subVerifyPhase',
            'verifyPhase:verify:echo',
            'verifyPhase:verify:foxtrot',
            'verifyPhase:verify:golf',
            'verifyPhase:verify:hotel',
            'verifyPhase',
        ].forEach((taskName) => {
            expect(testExports).toHaveProperty(taskName);
        });
    });

    it('builds a task tree from definition', () => {
        const testExports = {};
        createPhaseTreeTasks(defaultTestPhaseTreeDef, testExports);
        expect(testExports).toMatchSnapshot();
    });
});
