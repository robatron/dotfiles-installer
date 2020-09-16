const fs = require('fs');
const path = require('path');
const rmrf = require('rimraf');
const shell = require('shelljs');
const { v4: uuid } = require('uuid');
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

const fixtureBasePath = path.join(
    path.dirname(__filename),
    '__fixtures__',
    path.basename(__filename),
);

describe('installPackageViaGit', () => {
    const pkgName = 'tst-pkg';
    const repoUrl = 'https://github.com/octocat/Hello-World.git';
    const binSymlink = 'README';
    const fixtureDir = path.join(fixtureBasePath, 'installPackageViaGit');
    const tempBasePath = path.join(fixtureDir, '__tmp__');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        rmrf.sync(tempBasePath);
    });

    describe('basic cloning', () => {
        const tempDir = path.join(tempBasePath, uuid());
        const cloneDir = path.join(tempDir, 'opt', pkgName);
        const binDir = path.join(tempDir, 'bin');
        const tstPkg = new Package(pkgName, {
            gitPackage: { binDir, binSymlink, cloneDir, repoUrl },
        });

        it('installs a package via git', async () => {
            await installPackageViaGit(tstPkg);
            expect(fs.existsSync(path.join(cloneDir, '.git'))).toBe(true);
        });

        it('continues without error if package is already installed', async () => {
            await installPackageViaGit(tstPkg);
            expect(fs.existsSync(path.join(cloneDir, '.git'))).toBe(true);
        });
    });

    describe('undesireable cloning conditions', () => {
        it('throws on clone errors, cleans up empty clone directory', async () => {
            const tempDir = path.join(tempBasePath, uuid());
            const cloneDir = path.join(tempDir, 'opt', pkgName);
            const binDir = path.join(tempDir, 'bin');
            const tstPkg = new Package(pkgName, {
                gitPackage: { binDir, cloneDir, repoUrl: null },
            });

            // Verify it throws when the repoUrl is missing
            await expect(installPackageViaGit(tstPkg)).rejects.toThrowError(
                /error cloning/gi,
            );

            // Verify it cleans up the created directories
            expect(fs.existsSync(binDir)).toBe(false);
            expect(fs.existsSync(cloneDir)).toBe(false);
        });

        it('warns if target directory exists, skips cloning', async () => {
            const targetDir = path.join(fixtureDir, 'existingCloneDir');
            const cloneDir = path.join(targetDir, 'opt', pkgName);
            const binDir = path.join(targetDir, 'bin');
            const tstPkg = new Package(pkgName, {
                gitPackage: { binDir, cloneDir, repoUrl },
            });

            await installPackageViaGit(tstPkg);

            expect(log.warn).toHaveBeenCalledWith(
                expect.stringMatching(/directory exists/gi),
            );
            expect(fs.existsSync(path.join(cloneDir, '.git'))).toBe(false);
        });

        it('throws if target directory is a file', async () => {
            const targetDir = path.join(fixtureDir, 'cloneDirFileCollision');
            const cloneDir = path.join(targetDir, 'opt', pkgName);
            const binDir = path.join(targetDir, 'bin');
            const tstPkg = new Package(pkgName, {
                gitPackage: { binDir, binSymlink, cloneDir, repoUrl },
            });

            await expect(installPackageViaGit(tstPkg)).rejects.toThrowError(
                /Error installing package.*file exists/gi,
            );

            expect(fs.existsSync(path.join(cloneDir, '.git'))).toBe(false);
        });
    });

    describe('symlinking functionality', () => {
        it('symlinks the package binary', async () => {
            const tempDir = path.join(tempBasePath, uuid());
            const cloneDir = path.join(tempDir, 'opt', pkgName);
            const binDir = path.join(tempDir, 'bin');
            const tstPkg = new Package(pkgName, {
                gitPackage: { binDir, binSymlink, cloneDir, repoUrl },
            });
            const binSymlinkSrcPath = path.join(cloneDir, binSymlink);
            const binSymlinkDestPath = path.join(binDir, binSymlink);

            // Generate binary symlink target to avoid actually cloning
            fs.mkdirSync(cloneDir, { recursive: true });
            fs.closeSync(fs.openSync(binSymlinkSrcPath, 'w'));

            await installPackageViaGit(tstPkg);

            expect(
                fs.existsSync(binSymlinkDestPath) &&
                    fs.lstatSync(binSymlinkDestPath).isSymbolicLink(),
            ).toBe(true);
        });

        it("doesn't symlink the package binary if omitted", async () => {
            const tempDir = path.join(tempBasePath, uuid());
            const cloneDir = path.join(tempDir, 'opt', pkgName);
            const binDir = path.join(tempDir, 'bin');
            const tstPkg = new Package(pkgName, {
                gitPackage: { binDir, binSymlink: null, cloneDir, repoUrl },
            });
            const binSymlinkDestPath = path.join(binDir, binSymlink);

            // Generate clone directory target to avoid actually cloning
            fs.mkdirSync(cloneDir, { recursive: true });

            await installPackageViaGit(tstPkg);

            expect(
                fs.existsSync(binSymlinkDestPath) &&
                    fs.lstatSync(binSymlinkDestPath).isSymbolicLink(),
            ).toBe(false);
        });

        it("throws if the symlink doesn't exist in package", async () => {
            const targetDir = path.join(fixtureDir, 'fullyInstalled');
            const cloneDir = path.join(targetDir, 'opt', pkgName);
            const binDir = path.join(targetDir, 'bin');
            const tstPkg = new Package(pkgName, {
                gitPackage: {
                    binDir,
                    cloneDir,
                    binSymlink: 'non-existant-file.txt',
                    repoUrl,
                },
            });

            await expect(installPackageViaGit(tstPkg)).rejects.toThrowError(
                /bin symlink does not exist/gi,
            );
        });

        it('warns if a symlink already exists', async () => {
            const targetDir = path.join(fixtureDir, 'fullyInstalled');
            const cloneDir = path.join(targetDir, 'opt', pkgName);
            const binDir = path.join(targetDir, 'bin');
            const tstPkg = new Package(pkgName, {
                gitPackage: {
                    binDir,
                    cloneDir,
                    binSymlink,
                    repoUrl,
                },
            });

            await installPackageViaGit(tstPkg);

            expect(log.warn).toBeCalledWith(
                expect.stringMatching(/will not be symlinked/gi),
            );
        });

        it('throws if a non-symlink file exists', async () => {
            const targetDir = path.join(fixtureDir, 'binSymlinkFileCollision');
            const cloneDir = path.join(targetDir, 'opt', pkgName);
            const binDir = path.join(targetDir, 'bin');
            const tstPkg = new Package(pkgName, {
                gitPackage: {
                    binDir,
                    cloneDir,
                    binSymlink,
                    repoUrl,
                },
            });

            await expect(installPackageViaGit(tstPkg)).rejects.toThrowError(
                /error installing package.*file exists/gi,
            );
        });
    });

    describe('postInstall', () => {
        it('calls the post install if defined', async () => {
            const targetDir = path.join(fixtureDir, 'fullyInstalled');
            const cloneDir = path.join(targetDir, 'opt', pkgName);
            const binDir = path.join(targetDir, 'bin');
            const tstPkg = new Package(pkgName, {
                gitPackage: { binDir, cloneDir, binSymlink, repoUrl },
                postInstall: jest.fn(),
            });

            await installPackageViaGit(tstPkg);

            expect(tstPkg.actionArgs.postInstall).toBeCalledTimes(1);
            expect(tstPkg.actionArgs.postInstall).toBeCalledWith(tstPkg);
        });
    });
});

describe('installPackage', () => {
    const tstPkgName = 'tst-pkg';

    beforeEach(() => {
        jest.clearAllMocks();
        shell.exec = jest.fn(() => ({ code: 0 }));
    });

    it('installs a package with custom install commands if provided', () => {
        const pkg = new Package(tstPkgName, {
            installCommands: ['cmd-a', 'cmd-b', 'cmd-c'],
        });

        installPackage(pkg);

        pkg.actionArgs.installCommands.forEach((cmd, n) => {
            expect(shell.exec).nthCalledWith(n + 1, cmd);
        });
    });

    it('installs with "apt" if on mac', () => {
        platform.isLinux = jest.fn(() => true);

        const pkg = new Package(tstPkgName);

        installPackage(pkg);

        expect(platform.isLinux).toBeCalledTimes(1);
        expect(shell.exec).toBeCalledWith(`sudo apt install -y ${pkg.name}`);
    });

    it('installs with "brew" if on mac', () => {
        platform.isLinux = jest.fn(() => false);
        platform.isMac = jest.fn(() => true);

        const pkg = new Package(tstPkgName);

        installPackage(pkg);

        expect(platform.isLinux).toBeCalledTimes(1);
        expect(platform.isMac).toBeCalledTimes(1);
        expect(shell.exec).toBeCalledWith(
            `HOMEBREW_NO_AUTO_UPDATE=1 brew install ${pkg.name}`,
        );
    });

    describe('error states', () => {
        it('throws an error if unable to determine install commands', () => {
            platform.isLinux = jest.fn(() => false);
            platform.isMac = jest.fn(() => false);

            const pkg = new Package(tstPkgName);

            expect(() => installPackage(pkg)).toThrowErrorMatchingSnapshot();

            expect(platform.isLinux).toBeCalledTimes(1);
            expect(platform.isMac).toBeCalledTimes(1);
            expect(shell.exec).not.toBeCalled();
        });

        it('throws an error if the exec return code is nonzero', () => {
            shell.exec = () => ({ code: 1 });
            const pkg = new Package(tstPkgName, {
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

    describe('git package support', () => {
        const createTestCase = (
            fixtureDir,
            expectedResult,
            binSymlink = null,
        ) => {
            const targetFixtureDir = path.join(
                fixtureBasePath,
                'isPackageInstalled',
                fixtureDir,
            );
            const binDir = path.join(targetFixtureDir, 'bin');
            const cloneDir = path.join(targetFixtureDir, 'opt');

            const pkg = new Package('tst-pkg', {
                gitPackage: {
                    binDir,
                    binSymlink,
                    cloneDir,
                    repoUrl: 'https://github.com/octocat/Hello-World.git',
                },
            });

            it(`returns ${expectedResult} when ${fixtureDir}`, () => {
                expect(isPackageInstalled(pkg)).toBe(expectedResult);
            });
        };

        describe('when binSymlink is present', () => {
            [
                ['clonedAndSymlinked', true],
                ['justCloned', false],
                ['justSymlinked', false],
                ['neitherClonedNorSymlinked', false],
            ].forEach((paramCase) => {
                createTestCase(...paramCase, 'testFile.txt');
            });
        });

        describe('when binSymlink is not specified', () => {
            [
                ['clonedAndSymlinked', true],
                ['justCloned', true],
                ['justSymlinked', false],
                ['neitherClonedNorSymlinked', false],
            ].forEach((paramCase) => {
                createTestCase(...paramCase);
            });
        });

        describe('default dirs', () => {
            it('supports optional dirs', () => {
                const tstPkg = new Package('tst-pkg', { gitPackage: {} });
                expect(isPackageInstalled(tstPkg)).toBe(false);
            });
        });
    });

    describe('mac package support', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('queries `brew list` for the package, returns true if installed', () => {
            platform.isMac = jest.fn(() => true);
            shell.exec = jest.fn(() => ({ code: 0 }));
            const pkg = new Package('pkg');

            const result = isPackageInstalled(pkg);

            expect(result).toBe(true);
            expect(shell.exec).toBeCalledTimes(1);
            expect(shell.exec).toBeCalledWith(
                `brew list --versions ${pkg.name}`,
            );
        });

        it('... and returns false if not installed', () => {
            platform.isMac = jest.fn(() => true);
            shell.exec = jest.fn(() => ({ code: 1 }));
            const pkg = new Package('pkg');

            const result = isPackageInstalled(pkg);

            expect(result).toBe(false);
        });

        it('does not query `brew list` for the package if not a mac', () => {
            platform.isMac = jest.fn(() => false);
            shell.exec = jest.fn();
            const pkg = new Package('pkg');
            isPackageInstalled(pkg);
            expect(shell.exec).not.toBeCalled();
        });

        it('skips this test if verifyCommandExists or installCommands are present', () => {
            platform.isMac = jest.fn(() => true);
            shell.exec = jest.fn();

            const pkgVerifyCmdExists = new Package('pkg', {
                verifyCommandExists: true,
            });
            isPackageInstalled(pkgVerifyCmdExists);

            const pkgWithInstallCommands = new Package('pkg', {
                installCommands: true,
            });
            isPackageInstalled(pkgWithInstallCommands);

            expect(shell.exec).not.toBeCalled();
        });
    });
});
