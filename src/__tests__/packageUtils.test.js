const fs = require('fs');
const path = require('path');
const commandExists = require('command-exists');
const rmrf = require('rimraf');
const shell = require('shelljs');
const log = require('../log');
const { Package } = require('../Package');
const {
    installPackageViaGit,
    installPackage,
    isPackageInstalled,
} = require('../packageUtils');
const platform = require('../platformUtils');

jest.mock('shelljs');
jest.mock('../log');
jest.mock('../platformUtils');

describe('installPackageViaGit', () => {
    const gitUrl = 'https://github.com/octocat/Hello-World.git';
    const pkg = new Package('test-package', { gitUrl });
    const destDir = path.join(__dirname, '__tmp__', pkg.name);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Since I'm lazy and don't want to mock the git package, we need to
        // clean up the generated files
        rmrf.sync(path.join(destDir, '..'));
    });

    it('installs a package via git', (done) => {
        installPackageViaGit(pkg, destDir).finally(() => {
            expect(fs.existsSync(path.join(destDir, '.git'))).toBe(true);
            done();
        });
    });

    it('warns and declines to clone the repo if the target directory exists', (done) => {
        fs.mkdirSync(destDir, { recursive: true });

        installPackageViaGit(pkg, destDir).finally(() => {
            expect(log.warn).toHaveBeenCalledWith(
                expect.stringMatching(/package.*not installed.*delete/gi),
            );
            expect(fs.existsSync(path.join(destDir, '.git'))).toBe(false);
            done();
        });
    });

    it('errors and exits on clone errors', (done) => {
        const mockExit = jest
            .spyOn(process, 'exit')
            .mockImplementation(() => {});
        const testPkg = new Package('test-package', { gitUrl: null });

        installPackageViaGit(testPkg, destDir).finally(() => {
            expect(log.error).toHaveBeenCalledWith(
                expect.stringMatching(/error installing/gi),
            );
            expect(mockExit).toHaveBeenCalledWith(1);
            done();
        });
    });
});

describe('installPackage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        shell.exec = jest.fn(() => ({ code: 0 }));
    });

    it('installs a package with custom install commands if provided', () => {
        const pkg = new Package('test-package', {
            installCommands: ['cmd-a', 'cmd-b', 'cmd-c'],
        });

        installPackage(pkg);

        pkg.actionArgs.installCommands.forEach((cmd, n) => {
            expect(shell.exec).nthCalledWith(n + 1, cmd);
        });
    });

    it('installs with "apt" if on mac', () => {
        platform.isLinux = jest.fn(() => true);

        const pkg = new Package('test-package');

        installPackage(pkg);

        expect(platform.isLinux).toBeCalledTimes(1);
        expect(shell.exec).toBeCalledWith(`sudo apt install -y ${pkg.name}`);
    });

    it('installs with "brew" if on mac', () => {
        platform.isLinux = jest.fn(() => false);
        platform.isMac = jest.fn(() => true);

        const pkg = new Package('test-package');

        installPackage(pkg);

        expect(platform.isLinux).toBeCalledTimes(1);
        expect(platform.isMac).toBeCalledTimes(1);
        expect(shell.exec).toBeCalledWith(`brew install ${pkg.name}`);
    });

    describe('error states', () => {
        it('throws an error if unable to determine install commands', () => {
            platform.isLinux = jest.fn(() => false);
            platform.isMac = jest.fn(() => false);

            const pkg = new Package('test-package');

            expect(() => installPackage(pkg)).toThrowErrorMatchingSnapshot();

            expect(platform.isLinux).toBeCalledTimes(1);
            expect(platform.isMac).toBeCalledTimes(1);
            expect(shell.exec).not.toBeCalled();
        });

        it('throws an error if the exec return code is nonzero', () => {
            shell.exec = () => ({ code: 1 });
            const pkg = new Package('test-package', {
                installCommands: ['cmd-a', 'cmd-b', 'cmd-c'],
            });
            expect(() => installPackage(pkg)).toThrowErrorMatchingSnapshot();
        });
    });
});

// todo
describe.skip('isPackageinstalled', () => {});
