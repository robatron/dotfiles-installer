const gulp = require('gulp');
const {
    ACTIONS,
    defineTaskPhase,
    defineTaskTreeRoot,
    createTaskTree,
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
const taskTreeRoot = defineTaskTreeRoot([
    defineTaskPhase('installPhase', ACTIONS.INSTALL, [
        'alpha',
        'bravo',
        'charlie',
    ]),
    defineTaskPhase('runPhase', ACTIONS.RUN_PHASES, [
        defineTaskPhase('subInstallPhase', ACTIONS.INSTALL, [
            'delta',
            'echo',
            'foxtrot',
        ]),
        defineTaskPhase('subRunPhase', ACTIONS.RUN_PHASES, [
            defineTaskPhase('subSubInstallPhase', ACTIONS.INSTALL, [
                'golf',
                'hotel',
                'india',
            ]),
            defineTaskPhase('subSubVerifyPhase', ACTIONS.VERIFY, [
                'juliett',
                'kelo',
                'lima',
            ]),
        ]),
        defineTaskPhase('subVerifyPhase', ACTIONS.VERIFY, [
            'mike',
            'november',
            'oscar',
        ]),
    ]),
    defineTaskPhase(
        'verifyPhase',
        ACTIONS.VERIFY,
        ['papa', 'quebec', 'romeo', 'sierra'],
        {
            parallel: true,
        },
    ),
]);

describe('createTaskTree', () => {
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
        createTaskTree(taskTreeRoot, testExports);
        expect(testExports).toMatchSnapshot();
    });

    it('exposes all tasks globally', () => {
        const testExports = {};
        createTaskTree(taskTreeRoot, testExports);

        [
            'default',
            'installPhase:install:alpha',
            'installPhase:install:bravo',
            'installPhase:install:charlie',
            'installPhase',
            'runPhase:subInstallPhase:install:delta',
            'runPhase:subInstallPhase:install:echo',
            'runPhase:subInstallPhase:install:foxtrot',
            'runPhase:subInstallPhase',
            'runPhase:subRunPhase:subSubInstallPhase:install:golf',
            'runPhase:subRunPhase:subSubInstallPhase:install:hotel',
            'runPhase:subRunPhase:subSubInstallPhase:install:india',
            'runPhase:subRunPhase:subSubInstallPhase',
            'runPhase:subRunPhase:subSubVerifyPhase:verify:juliett',
            'runPhase:subRunPhase:subSubVerifyPhase:verify:kelo',
            'runPhase:subRunPhase:subSubVerifyPhase:verify:lima',
            'runPhase:subRunPhase:subSubVerifyPhase',
            'runPhase:subRunPhase',
            'runPhase:subVerifyPhase:verify:mike',
            'runPhase:subVerifyPhase:verify:november',
            'runPhase:subVerifyPhase:verify:oscar',
            'runPhase:subVerifyPhase',
            'runPhase',
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
