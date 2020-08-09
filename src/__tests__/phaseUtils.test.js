const { createPhaseDef, createPhaseTreeDef } = require('../phaseUtils');
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

describe('createPhaseTreeDef', () => {
    it('creates a root phase definition', () => {
        const result = createPhaseTreeDef(testTargets, true);
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
        expect(result).toEqual(expected);
    });

    it('leaverages createPhaseDef', () => {
        const result = createPhaseTreeDef(testTargets, true);
        const expected = [
            createPhaseDef('default', ACTIONS.RUN_PHASES, testTargets, {
                parallel: true,
            }),
        ];
        expect(result).toEqual(expected);
    });

    it('defaults to serial', () => {
        const result = createPhaseTreeDef(testTargets);
        const expected = [
            createPhaseDef('default', ACTIONS.RUN_PHASES, testTargets, {
                parallel: false,
            }),
        ];
        expect(result).toEqual(expected);
    });
});
