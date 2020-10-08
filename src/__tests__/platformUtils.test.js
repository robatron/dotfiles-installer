const { isLinux, isMac } = require('../platformUtils');

describe('platformUtils', () => {
    beforeEach(() => {
        this.originalPlatform = Object.getOwnPropertyDescriptor(
            process,
            'platform',
        );
    });

    afterEach(() => {
        Object.defineProperty(process, 'platform', this.originalPlatform);
    });

    it('returns true for linux, false for mac', () => {
        Object.defineProperty(process, 'platform', {
            value: 'linux',
        });

        expect(isLinux()).toBe(true);
        expect(isMac()).toBe(false);
    });

    it('returns true for mac, false for linux', () => {
        Object.defineProperty(process, 'platform', {
            value: 'darwin',
        });

        expect(isLinux()).toBe(false);
        expect(isMac()).toBe(true);
    });
});
