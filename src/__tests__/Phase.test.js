const Phase = require('../Phase');

describe('Phase', () => {
    it('creates a new Phase with default options', () => {
        expect(new Phase()).toMatchInlineSnapshot(`
            Phase {
              "action": undefined,
              "name": "namelessPhase",
              "packageOpts": undefined,
              "parallel": false,
              "targets": undefined,
            }
        `);
    });

    it('creates a new phase with options', () => {
        expect(
            new Phase('phase', {
                action: 'action',
                packageOpts: 'pkg-opts',
                parallel: 'parallel',
                targets: 'targets',
            }),
        ).toMatchInlineSnapshot(`
            Phase {
              "action": "action",
              "name": "phase",
              "packageOpts": "pkg-opts",
              "parallel": "parallel",
              "targets": "targets",
            }
        `);
    });
});
