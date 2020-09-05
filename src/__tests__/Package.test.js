const { createPackageFromDef, Package } = require('../Package');

describe('createPackageFromDef', () => {
    it('creates a new package object a string definition', () => {
        expect(createPackageFromDef('name', 'action')).toStrictEqual(
            new Package('name', { action: 'action' }),
        );
    });

    it('creates a new package object from an array definition', () => {
        expect(
            createPackageFromDef(['name', { foo: 'bar' }], 'action'),
        ).toStrictEqual(new Package('name', { foo: 'bar', action: 'action' }));
    });

    it('throws if package definition is an unsupported type', () => {
        expect(() => {
            createPackageFromDef(123);
        }).toThrowErrorMatchingInlineSnapshot(
            `"Malformed package definition: 123"`,
        );
    });
});
