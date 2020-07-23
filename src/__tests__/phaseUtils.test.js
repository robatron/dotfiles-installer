const { createPhaseDef, createPhaseDefTreeRoot } = require('../phaseUtils');
const { ACTIONS } = require('../constants');

const testTargets = ['target-a', 'target-b', 'target-c'];
const testOpts = { opt1: 'a', opt2: 'b' };

describe('createPhaseDef', () => {
    it('creates a phase definition', () => {
        const result = createPhaseDef('name', 'action', testTargets, testOpts);
        const expected = [
            'name',
            {
                action: 'action',
                targets: testTargets,
                ...testOpts,
            },
        ];
        expect(result).toEqual(expected);
    });

    it('supports default empty options', () => {
        const result = createPhaseDef('name', 'action', testTargets);
        const expected = [
            'name',
            {
                action: 'action',
                targets: testTargets,
            },
        ];
        expect(result).toEqual(expected);
    });
});

describe('createPhaseDefTreeRoot', () => {
    it('creates a root phase definition', () => {
        const result = createPhaseDefTreeRoot(testTargets, true);
        const expected = [
            [
                'default',
                {
                    action: ACTIONS.RUN_PHASES,
                    parallel: true,
                    targets: testTargets,
                },
            ],
        ];
    });

    it('leaverages createPhaseDef', () => {
        const result = createPhaseDefTreeRoot(testTargets, true);
        const expected = [
            createPhaseDef('default', ACTIONS.RUN_PHASES, testTargets, {
                parallel: true,
            }),
        ];
    });

    it('defaults to serial', () => {
        const result = createPhaseDefTreeRoot(testTargets);
        const expected = [
            createPhaseDef('default', ACTIONS.RUN_PHASES, testTargets, {
                parallel: false,
            }),
        ];
    });
});
