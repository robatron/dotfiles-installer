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
        createPhaseDef('subRunPhase', ACTIONS.RUN_PHASES, [
            createPhaseDef('subSubInstallPhase', ACTIONS.INSTALL, [
                'golf',
                'hotel',
                'india',
            ]),
            createPhaseDef('subSubVerifyPhase', ACTIONS.VERIFY, [
                'juliett',
                'kelo',
                'lima',
            ]),
        ]),
        createPhaseDef('subVerifyPhase', ACTIONS.VERIFY, [
            'mike',
            'november',
            'oscar',
        ]),
    ]),
    createPhaseDef(
        'verifyPhase',
        ACTIONS.VERIFY,
        ['papa', 'quebec', 'romeo', 'sierra'],
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

        console.log('>>>', JSON.stringify(Object.keys(testExports)));

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
            'subRunPhase',
            'subSubInstallPhase:install:golf',
            'subSubInstallPhase:install:hotel',
            'subSubInstallPhase:install:india',
            'subSubInstallPhase',
            'subSubVerifyPhase:verify:juliett',
            'subSubVerifyPhase:verify:kelo',
            'subSubVerifyPhase:verify:lima',
            'subSubVerifyPhase',
            'subVerifyPhase:verify:mike',
            'subVerifyPhase:verify:november',
            'subVerifyPhase:verify:oscar',
            'subVerifyPhase',
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
