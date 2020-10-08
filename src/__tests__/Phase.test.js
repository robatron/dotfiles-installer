const Phase = require('../Phase');

describe('Phase', () => {
    it('creates a new Phase with default options', () => {
        expect(new Phase()).toMatchInlineSnapshot(`
            Phase {
              "action": undefined,
              "name": "namelessPhase",
              "parallel": false,
              "targetOpts": undefined,
              "targets": undefined,
            }
        `);
    });

    it('creates a new phase with options', () => {
        expect(
            new Phase('phase', {
                action: 'action',
                targetOpts: 'target-opts',
                parallel: 'parallel',
                targets: 'targets',
            }),
        ).toMatchInlineSnapshot(`
            Phase {
              "action": "action",
              "name": "phase",
              "parallel": "parallel",
              "targetOpts": "target-opts",
              "targets": "targets",
            }
        `);
    });
});
