const { createPackage, Package } = require('../Package');

describe('createPackage', () => {
    it('creates a new package object a string definition', () => {
        expect(createPackage('name', 'action')).toStrictEqual(
            new Package('name', { action: 'action' }),
        );
    });

    it('creates a new package object from an array definition', () => {
        expect(createPackage(['name', { foo: 'bar' }], 'action')).toStrictEqual(
            new Package('name', { foo: 'bar', action: 'action' }),
        );
    });

    it('throws if package definition is an unsupported type', () => {
        expect(() => {
            createPackage(123);
        }).toThrowErrorMatchingInlineSnapshot(
            `"Malformed package definition: 123"`,
        );
    });
});
