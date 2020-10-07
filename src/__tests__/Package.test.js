const { createPackageFromDef, Package } = require('../Package');

describe('Package', () => {
    it('creates a new package with options', () => {
        expect(
            new Package('pkg-name', {
                action: 'action',
                actionArgs: 'act-args',
                command: 'cmd',
                forceAction: 'force-act',
                skipAction: 'skip-act',
            }),
        ).toMatchInlineSnapshot(`
            Package {
              "action": "action",
              "actionArgs": "act-args",
              "command": "cmd",
              "forceAction": "force-act",
              "name": "pkg-name",
              "skipAction": "skip-act",
            }
        `);
    });

    it('creates a new Package with default vals', () => {
        expect(new Package('pkg-name')).toMatchInlineSnapshot(`
            Package {
              "action": undefined,
              "actionArgs": Object {},
              "command": "pkg-name",
              "forceAction": false,
              "name": "pkg-name",
              "skipAction": false,
            }
        `);
    });

    it('throws if name is not defined', () => {
        expect(() => {
            new Package();
        }).toThrowErrorMatchingInlineSnapshot(`"A package name is required"`);
    });

    describe('actionArgs', () => {
        const pkgOpts = { a: 1, b: 2, c: 3 };

        it('fills actionArgs with all package options', () => {
            const pkg = new Package('pkg', pkgOpts);
            expect(pkg.actionArgs).toStrictEqual(pkgOpts);
        });

        it('uses only packageArgs if explicitly defined', () => {
            const actionArgs = { action: 'args' };
            const pkg = new Package('pkg', {
                ...pkgOpts,
                actionArgs,
            });
            expect(pkg.actionArgs).toStrictEqual(actionArgs);
        });
    });
});

describe('createPackageFromDef', () => {
    describe('string-based package defs', () => {
        it('creates a new package object a string definition', () => {
            expect(createPackageFromDef('name', 'action')).toStrictEqual(
                new Package('name', { action: 'action' }),
            );
        });

        it('supports inherited package options', () => {
            expect(
                createPackageFromDef('name', 'action', { inherited: 'option' }),
            ).toStrictEqual(
                new Package('name', { action: 'action', inherited: 'option' }),
            );
        });
    });

    describe('array-based defs', () => {
        it('creates a new package object from an array definition', () => {
            expect(
                createPackageFromDef(['name', { pkg: 'option' }], 'action'),
            ).toStrictEqual(
                new Package('name', { action: 'action', pkg: 'option' }),
            );
        });

        it('supports inherited package options', () => {
            expect(
                createPackageFromDef(['name', { pkg: 'option' }], 'action', {
                    inherited: 'option',
                }),
            ).toStrictEqual(
                new Package('name', {
                    action: 'action',
                    inherited: 'option',
                    pkg: 'option',
                }),
            );
        });
    });

    it('throws if package definition is an unsupported type', () => {
        expect(() => {
            createPackageFromDef(123);
        }).toThrowErrorMatchingInlineSnapshot(
            `"Malformed package definition: 123"`,
        );
    });
});
