const { defineTaskPhase, defineTaskTreeRoot } = require('../phaseUtils');
const { ACTIONS } = require('../constants');

const testTargets = ['target-a', 'target-b', 'target-c'];
const testOpts = { opt1: 'a', opt2: 'b' };

describe('defineTaskPhase', () => {
    it('creates a phase definition', () => {
        const result = defineTaskPhase('name', 'action', testTargets, testOpts);
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
        const result = defineTaskPhase('name', 'action', testTargets);
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

describe('defineTaskTreeRoot', () => {
    it('creates a root phase definition', () => {
        const result = defineTaskTreeRoot(testTargets, true);
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

    it('leaverages defineTaskPhase', () => {
        const result = defineTaskTreeRoot(testTargets, true);
        const expected = [
            defineTaskPhase('default', ACTIONS.RUN_PHASES, testTargets, {
                parallel: true,
            }),
        ];
        expect(result).toEqual(expected);
    });

    it('defaults to series', () => {
        const result = defineTaskTreeRoot(testTargets);
        const expected = [
            defineTaskPhase('default', ACTIONS.RUN_PHASES, testTargets, {
                parallel: false,
            }),
        ];
        expect(result).toEqual(expected);
    });
});
