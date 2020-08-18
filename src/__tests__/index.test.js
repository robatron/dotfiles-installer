const gulp = require('gulp');
const {
    ACTIONS,
    createPhaseDef,
    createPhaseTreeDef,
    createPhaseTreeTasks,
} = require('../index');

jest.mock('gulp');

/**
 * defaultTestPhaseTreeDef is a definition of a phase tree exemplifying
 * thefollowing features:
 *
 * Phase actions:
 *  - INSTALL
 *  - VERIFY
 *  - RUN_PHASES
 *
 * Phase async:
 *  - parallel
 *  - series (default)
 */

const defaultTestPhaseTreeDef = createPhaseTreeDef([
    createPhaseDef('installPhase', ACTIONS.INSTALL, [
        'alpha',
        'bravo',
        'charlie',
    ]),
    createPhaseDef('runPhase', ACTIONS.RUN_PHASES, [
        createPhaseDef('subInstallPhase', ACTIONS.INSTALL, [
            'delta',
            'echo',
            'foxtrot',
        ]),
        createPhaseDef('subVerifyPhase', ACTIONS.VERIFY, [
            'golf',
            'hotel',
            'india',
        ]),
    ]),
    createPhaseDef(
        'verifyPhase',
        ACTIONS.VERIFY,
        [
            'juliett',
            'kelo',
            'lima',
            'mike',
            'november',
            'oscar',
            'papa',
            'quebec',
            'romeo',
            'sierra',
        ],
        {
            parallel: true,
        },
    ),
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
    });

    it('builds a task tree from definition', () => {
        const testExports = {};
        createPhaseTreeTasks(defaultTestPhaseTreeDef, testExports);
        expect(testExports).toMatchSnapshot();
    });

    it('exposes all tasks globally', () => {
        const testExports = {};
        createPhaseTreeTasks(defaultTestPhaseTreeDef, testExports);
        [
            'default',
            'installPhase:install:alpha',
            'installPhase:install:bravo',
            'installPhase:install:charlie',
            'installPhase',
            'runPhase',
            'subInstallPhase:install:delta',
            'subInstallPhase:install:echo',
            'subInstallPhase:install:foxtrot',
            'subInstallPhase',
            'subVerifyPhase:verify:golf',
            'subVerifyPhase:verify:hotel',
            'subVerifyPhase:verify:india',
            'subVerifyPhase',
            'verifyPhase:verify:juliett',
            'verifyPhase:verify:kelo',
            'verifyPhase:verify:lima',
            'verifyPhase:verify:mike',
            'verifyPhase:verify:november',
            'verifyPhase:verify:oscar',
            'verifyPhase:verify:papa',
            'verifyPhase:verify:quebec',
            'verifyPhase:verify:romeo',
            'verifyPhase:verify:sierra',
            'verifyPhase',
        ].forEach((taskName) => {
            expect(testExports).toHaveProperty(taskName);
        });
    });
});
