const { execCommands } = require('../../execUtils');
const log = require('../../log');
const { Target } = require('../../Target');
const { isLinux, isMac } = require('../../platformUtils');
const installPackage = require('../installPackage');

jest.mock('../../execUtils');
jest.mock('../../log');
jest.mock('../../platformUtils');

describe('installPackage', () => {
    const tstTargetName = 'tst-target';

    it('installs a target with custom install commands if provided', () => {
        const target = new Target(tstTargetName, {
            actionCommands: ['cmd-a', 'cmd-b', 'cmd-c'],
        });

        installPackage(target);

        expect(execCommands).toBeCalledWith(target.actionArgs.actionCommands);
        expect(log.info.mock.calls).toMatchInlineSnapshot(`
            Array [
              Array [
                "Installing target 'tst-target'...",
              ],
            ]
        `);
    });

    it('installs with "apt" if on linux', () => {
        isLinux.mockImplementationOnce(() => true);

        const target = new Target(tstTargetName);

        installPackage(target);

        expect(isLinux).toBeCalledTimes(1);
        expect(isMac).toBeCalledTimes(0);
        expect(execCommands).toBeCalledWith([
            `sudo apt install -y ${target.name}`,
        ]);
    });

    it('installs with "brew" if on mac', () => {
        isLinux.mockImplementationOnce(() => false);
        isMac.mockImplementationOnce(() => true);

        const target = new Target(tstTargetName);

        installPackage(target);

        expect(isLinux).toBeCalledTimes(1);
        expect(isMac).toBeCalledTimes(1);
        expect(execCommands).toBeCalledWith([`brew install ${target.name}`]);
    });

    it('installs with "brew cask" if on mac and isGUI is set', () => {
        isLinux.mockImplementationOnce(() => false);
        isMac.mockImplementationOnce(() => true);

        const target = new Target(tstTargetName, { isGUI: true });

        installPackage(target);

        expect(isLinux).toBeCalledTimes(1);
        expect(isMac).toBeCalledTimes(1);
        expect(execCommands).toBeCalledWith([
            `brew install --cask ${target.name}`,
        ]);
    });

    it('runs the postInstall callback if specified', () => {
        const target = new Target(tstTargetName, {
            actionCommands: ['cmd-a', 'cmd-b', 'cmd-c'],
            postInstall: jest.fn(),
        });

        installPackage(target);

        expect(target.actionArgs.postInstall).toBeCalledWith(target);
        expect(log.info.mock.calls).toMatchInlineSnapshot(`
            Array [
              Array [
                "Installing target 'tst-target'...",
              ],
              Array [
                "Running post-install scripts for tst-target...",
              ],
            ]
        `);
    });

    describe('error states', () => {
        it('throws an error if unable to determine install commands', async () => {
            isLinux.mockImplementationOnce(() => false);
            isMac.mockImplementationOnce(() => false);

            const target = new Target(tstTargetName);

            await expect(() =>
                installPackage(target),
            ).rejects.toThrowErrorMatchingInlineSnapshot(
                `"Cannot determine install command(s) for target 'tst-target'"`,
            );

            expect(isLinux).toBeCalledTimes(1);
            expect(isMac).toBeCalledTimes(1);
            expect(execCommands).not.toBeCalled();
        });
    });
});
