const fs = require('fs');
const path = require('path');
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

// Allow a little more time for the git clone to finish
jest.setTimeout(15000);

describe('installPackageViaGit', () => {
    const gitUrl = 'https://github.com/octocat/Hello-World.git';
    const binSymlink = 'README';
    const pkg = new Package('test-package', { binSymlink, gitUrl });
    const tempDir = path.join(__dirname, '__tmp__');
    const cloneDir = path.join(tempDir, 'opt', pkg.name);
    const binDir = path.join(tempDir, 'bin');
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Since I'm lazy and don't want to mock the git package or other
        // filesystem functions, we need to clean up the generated files
        rmrf.sync(tempDir);
    });

    it('installs a package via git', (done) => {
        installPackageViaGit(pkg, cloneDir, binDir).finally(() => {
            expect(fs.existsSync(path.join(cloneDir, '.git'))).toBe(true);
            done();
        });
    });

    it('symlinks the package binary', (done) => {
        const binPath = path.join(binDir, binSymlink);
        installPackageViaGit(pkg, cloneDir, binDir).finally(() => {
            expect(
                fs.existsSync(binPath) &&
                    fs.lstatSync(binPath).isSymbolicLink(),
            ).toBe(true);
            done();
        });
    });

    it('errors and exits on clone errors', (done) => {
        const testPkg = new Package('test-package', { gitUrl: null });

        installPackageViaGit(testPkg, cloneDir, binDir).finally(() => {
            expect(log.error).toHaveBeenCalledWith(
                expect.stringMatching(/error installing/gi),
            );
            expect(mockExit).toHaveBeenCalledWith(1);
            done();
        });
    });

    describe('undesireable target clone directory states', () => {
        it('warns and returns early if target directory exists', () => {
            fs.mkdirSync(cloneDir, { recursive: true });

            installPackageViaGit(pkg, cloneDir, binDir);
            expect(log.warn).toHaveBeenCalledWith(
                expect.stringMatching(/directory exists/gi),
            );
            expect(fs.existsSync(path.join(cloneDir, '.git'))).toBe(false);
        });

        it('errors and exits if target directory is a file', () => {
            const destFile = path.join(cloneDir, '..', 'foo.txt');
            fs.mkdirSync(path.join(destFile, '..'), { recursive: true });
            fs.closeSync(fs.openSync(destFile, 'w'));

            installPackageViaGit(pkg, destFile, binDir);
            expect(log.error).toHaveBeenCalledWith(
                expect.stringMatching(/error installing/gi),
            );
            expect(mockExit).toHaveBeenCalledWith(1);
            expect(fs.existsSync(path.join(cloneDir, '.git'))).toBe(false);
        });
    });

    describe.skip('undesireable target symlink states', () => {
        it("errors and exits if the symlink doesn't exist in package", () => {
            const testPkg = new Package('test-package', {
                binSymlink: 'non-existant-file.txt',
                gitUrl,
            });
            installPackageViaGit(testPkg, cloneDir, binDir);
            expect(log.error).toHaveBeenCalledWith(
                expect.stringMatching(/error installing/gi),
            );
            expect(mockExit).toHaveBeenCalledWith(1);
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

describe('isPackageinstalled', () => {
    it('returns true if a command exists', () => {
        // All systems should have the 'cd' command
        const pkg = new Package('cd');
        expect(isPackageInstalled(pkg)).toBe(true);
    });

    it('returns false if a command does not exists', () => {
        const pkg = new Package('nänəɡˈzistənt');
        expect(isPackageInstalled(pkg)).toBe(false);
    });

    describe('custom test function support', () => {
        [true, false].forEach((condition) => {
            it(`returns ${condition} when test fn returns ${condition}`, () => {
                const pkg = new Package('tst-cmd', { testFn: () => condition });
                expect(isPackageInstalled(pkg)).toBe(condition);
            });
        });
    });
});
