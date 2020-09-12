const gulp = require('gulp');
const {
    ACTIONS,
    definePhase,
    defineRoot,
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
const taskTreeRoot = defineRoot([
    definePhase('installPhase', ACTIONS.INSTALL, ['alpha', 'bravo', 'charlie']),
    definePhase('runPhase', ACTIONS.RUN_PHASES, [
        definePhase('subInstallPhase', ACTIONS.INSTALL, [
            'delta',
            'echo',
            'foxtrot',
        ]),
        definePhase('subRunPhase', ACTIONS.RUN_PHASES, [
            definePhase('subSubInstallPhase', ACTIONS.INSTALL, [
                'golf',
                'hotel',
                'india',
            ]),
            definePhase('subSubVerifyPhase', ACTIONS.VERIFY, [
                'juliett',
                'kelo',
                'lima',
            ]),
        ]),
        definePhase('subVerifyPhase', ACTIONS.VERIFY, [
            'mike',
            'november',
            'oscar',
        ]),
    ]),
    definePhase(
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
            'installPhase:alpha',
            'installPhase:bravo',
            'installPhase:charlie',
            'installPhase',
            'runPhase:subInstallPhase:delta',
            'runPhase:subInstallPhase:echo',
            'runPhase:subInstallPhase:foxtrot',
            'runPhase:subInstallPhase',
            'runPhase:subRunPhase:subSubInstallPhase:golf',
            'runPhase:subRunPhase:subSubInstallPhase:hotel',
            'runPhase:subRunPhase:subSubInstallPhase:india',
            'runPhase:subRunPhase:subSubInstallPhase',
            'runPhase:subRunPhase:subSubVerifyPhase:juliett',
            'runPhase:subRunPhase:subSubVerifyPhase:kelo',
            'runPhase:subRunPhase:subSubVerifyPhase:lima',
            'runPhase:subRunPhase:subSubVerifyPhase',
            'runPhase:subRunPhase',
            'runPhase:subVerifyPhase:mike',
            'runPhase:subVerifyPhase:november',
            'runPhase:subVerifyPhase:oscar',
            'runPhase:subVerifyPhase',
            'runPhase',
            'verifyPhase:papa',
            'verifyPhase:quebec',
            'verifyPhase:romeo',
            'verifyPhase:sierra',
            'verifyPhase',
        ].forEach((taskName) => {
            expect(testExports).toHaveProperty(taskName);
        });
    });
});
