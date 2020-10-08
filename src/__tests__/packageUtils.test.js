const fs = require('fs');
const path = require('path');
const rmrf = require('rimraf');
const { exec } = require('shelljs');
const { v4: uuid } = require('uuid');
const { execCommands } = require('../execUtils');
const log = require('../log');
const { Target } = require('../Target');
const {
    installPackageViaGit,
    installPackage,
    isPackageInstalled,
} = require('../packageUtils');
const { isLinux, isMac } = require('../platformUtils');

jest.mock('shelljs', () => ({
    exec: jest.fn(() => ({
        code: 0,
    })),
}));
jest.mock('../execUtils');
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
    const targetName = 'tst-target';
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
        const cloneDir = path.join(tempDir, 'opt', targetName);
        const binDir = path.join(tempDir, 'bin');
        const tstTarget = new Target(targetName, {
            gitPackage: { binDir, binSymlink, cloneDir, repoUrl },
        });

        it('installs a target via git', async () => {
            await installPackageViaGit(tstTarget);
            expect(fs.existsSync(path.join(cloneDir, '.git'))).toBe(true);
        });

        it('continues without error if target is already installed', async () => {
            await installPackageViaGit(tstTarget);
            expect(fs.existsSync(path.join(cloneDir, '.git'))).toBe(true);
        });
    });

    describe('undesireable cloning conditions', () => {
        it('throws on clone errors, cleans up empty clone directory', async () => {
            const tempDir = path.join(tempBasePath, uuid());
            const cloneDir = path.join(tempDir, 'opt', targetName);
            const binDir = path.join(tempDir, 'bin');
            const tstTarget = new Target(targetName, {
                gitPackage: { binDir, cloneDir, repoUrl: 'repo-url' },
            });

            // Verify it throws when the repoUrl is missing
            await expect(
                installPackageViaGit(tstTarget),
            ).rejects.toThrowErrorMatchingInlineSnapshot(
                `"Error cloning repo-url for target 'tst-target': Error: unsupported URL protocol"`,
            );

            // Verify it cleans up the created directories
            expect(fs.existsSync(binDir)).toBe(false);
            expect(fs.existsSync(cloneDir)).toBe(false);
        });

        it('warns if target directory exists, skips cloning', async () => {
            const targetDir = path.join(fixtureDir, 'existingCloneDir');
            const cloneDir = path.join(targetDir, 'opt', targetName);
            const binDir = path.join(targetDir, 'bin');
            const tstTarget = new Target(targetName, {
                gitPackage: { binDir, cloneDir, repoUrl },
            });

            await installPackageViaGit(tstTarget);

            expect(log.warn).toHaveBeenCalledWith(
                expect.stringMatching(/directory exists/gi),
            );
            expect(fs.existsSync(path.join(cloneDir, '.git'))).toBe(false);
        });

        it('throws if target directory is a file', async () => {
            const targetDir = path.join(fixtureDir, 'cloneDirFileCollision');
            const cloneDir = path.join(targetDir, 'opt', targetName);
            const binDir = path.join(targetDir, 'bin');
            const tstTarget = new Target(targetName, {
                gitPackage: { binDir, binSymlink, cloneDir, repoUrl },
            });

            await expect(installPackageViaGit(tstTarget)).rejects.toThrowError(
                /Error installing target.*file exists/gi,
            );

            expect(fs.existsSync(path.join(cloneDir, '.git'))).toBe(false);
        });
    });

    describe('symlinking functionality', () => {
        it('symlinks the target binary', async () => {
            const tempDir = path.join(tempBasePath, uuid());
            const cloneDir = path.join(tempDir, 'opt', targetName);
            const binDir = path.join(tempDir, 'bin');
            const tstTarget = new Target(targetName, {
                gitPackage: { binDir, binSymlink, cloneDir, repoUrl },
            });
            const binSymlinkSrcPath = path.join(cloneDir, binSymlink);
            const binSymlinkDestPath = path.join(binDir, binSymlink);

            // Generate binary symlink target to avoid actually cloning
            fs.mkdirSync(cloneDir, { recursive: true });
            fs.closeSync(fs.openSync(binSymlinkSrcPath, 'w'));

            await installPackageViaGit(tstTarget);

            expect(
                fs.existsSync(binSymlinkDestPath) &&
                    fs.lstatSync(binSymlinkDestPath).isSymbolicLink(),
            ).toBe(true);
        });

        it("doesn't symlink the target binary if omitted", async () => {
            const tempDir = path.join(tempBasePath, uuid());
            const cloneDir = path.join(tempDir, 'opt', targetName);
            const binDir = path.join(tempDir, 'bin');
            const tstTarget = new Target(targetName, {
                gitPackage: { binDir, binSymlink: null, cloneDir, repoUrl },
            });
            const binSymlinkDestPath = path.join(binDir, binSymlink);

            // Generate clone directory target to avoid actually cloning
            fs.mkdirSync(cloneDir, { recursive: true });

            await installPackageViaGit(tstTarget);

            expect(
                fs.existsSync(binSymlinkDestPath) &&
                    fs.lstatSync(binSymlinkDestPath).isSymbolicLink(),
            ).toBe(false);
        });

        it("throws if the symlink doesn't exist in target", async () => {
            const targetDir = path.join(fixtureDir, 'fullyInstalled');
            const cloneDir = path.join(targetDir, 'opt', targetName);
            const binDir = path.join(targetDir, 'bin');
            const tstTarget = new Target(targetName, {
                gitPackage: {
                    binDir,
                    cloneDir,
                    binSymlink: 'non-existant-file.txt',
                    repoUrl,
                },
            });

            await expect(installPackageViaGit(tstTarget)).rejects.toThrowError(
                /bin symlink does not exist/gi,
            );
        });

        it('warns if a symlink already exists', async () => {
            const targetDir = path.join(fixtureDir, 'fullyInstalled');
            const cloneDir = path.join(targetDir, 'opt', targetName);
            const binDir = path.join(targetDir, 'bin');
            const tstTarget = new Target(targetName, {
                gitPackage: {
                    binDir,
                    cloneDir,
                    binSymlink,
                    repoUrl,
                },
            });

            await installPackageViaGit(tstTarget);

            expect(log.warn).toBeCalledWith(
                expect.stringMatching(/will not be symlinked/gi),
            );
        });

        it('throws if a non-symlink file exists', async () => {
            const targetDir = path.join(fixtureDir, 'binSymlinkFileCollision');
            const cloneDir = path.join(targetDir, 'opt', targetName);
            const binDir = path.join(targetDir, 'bin');
            const tstTarget = new Target(targetName, {
                gitPackage: {
                    binDir,
                    cloneDir,
                    binSymlink,
                    repoUrl,
                },
            });

            await expect(installPackageViaGit(tstTarget)).rejects.toThrowError(
                /error installing target.*file exists/gi,
            );
        });
    });

    describe('postInstall', () => {
        it('calls the post install if defined', async () => {
            const targetDir = path.join(fixtureDir, 'fullyInstalled');
            const cloneDir = path.join(targetDir, 'opt', targetName);
            const binDir = path.join(targetDir, 'bin');
            const tstTarget = new Target(targetName, {
                gitPackage: { binDir, cloneDir, binSymlink, repoUrl },
                postInstall: jest.fn(),
            });

            await installPackageViaGit(tstTarget);

            expect(tstTarget.actionArgs.postInstall).toBeCalledTimes(1);
            expect(tstTarget.actionArgs.postInstall).toBeCalledWith(tstTarget);
        });
    });
});

describe('installPackage', () => {
    const tstTargetName = 'tst-target';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('installs a target with custom install commands if provided', () => {
        const target = new Target(tstTargetName, {
            actionCommands: ['cmd-a', 'cmd-b', 'cmd-c'],
        });

        installPackage(target);

        expect(execCommands).toBeCalledWith(target.actionArgs.actionCommands);
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
        expect(execCommands).toBeCalledWith([
            `HOMEBREW_NO_AUTO_UPDATE=1 brew install ${target.name}`,
        ]);
    });

    it('installs with "brew cask" if on mac and isGUI is set', () => {
        isLinux.mockImplementationOnce(() => false);
        isMac.mockImplementationOnce(() => true);

        const target = new Target(tstTargetName, { isGUI: true });

        installPackage(target);

        expect(isLinux).toBeCalledTimes(1);
        expect(isMac).toBeCalledTimes(1);
        expect(execCommands).toBeCalledWith([
            `HOMEBREW_NO_AUTO_UPDATE=1 brew cask install ${target.name}`,
        ]);
    });

    describe('error states', () => {
        it('throws an error if unable to determine install commands', () => {
            isLinux.mockImplementationOnce(() => false);
            isMac.mockImplementationOnce(() => false);

            const target = new Target(tstTargetName);

            expect(() =>
                installPackage(target),
            ).toThrowErrorMatchingInlineSnapshot(
                `"Cannot determine install command(s) for target 'tst-target'"`,
            );

            expect(isLinux).toBeCalledTimes(1);
            expect(isMac).toBeCalledTimes(1);
            expect(execCommands).not.toBeCalled();
        });
    });
});

describe('isPackageinstalled', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('git target support', () => {
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

            const target = new Target('tst-target', {
                gitPackage: {
                    binDir,
                    binSymlink,
                    cloneDir,
                    repoUrl: 'https://github.com/octocat/Hello-World.git',
                },
            });

            it(`returns ${expectedResult} when ${fixtureDir}`, () => {
                expect(isPackageInstalled(target)).toBe(expectedResult);
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
                const tstTarget = new Target('tst-target', { gitPackage: {} });
                expect(isPackageInstalled(tstTarget)).toBe(false);
            });
        });
    });

    describe('command existence', () => {
        it('verifies a command is available when the target has custom `actionCommands`', () => {
            const target = new Target('cd', { actionCommands: [] });
            expect(isPackageInstalled(target)).toBe(true);
        });

        it('verifies a command is available when `verifyCommandExists` is explicitly set', () => {
            const target = new Target('cd', { verifyCommandExists: true });
            expect(isPackageInstalled(target)).toBe(true);
        });

        it('returns false if a command does not exists', () => {
            const target = new Target('nänəɡˈzistənt', {
                verifyCommandExists: true,
            });
            expect(isPackageInstalled(target)).toBe(false);
        });
    });

    describe('system target manager verification', () => {
        describe('linux', () => {
            beforeEach(() => {
                isLinux.mockImplementation(() => true);
                isMac.mockImplementation(() => false);
            });

            it('queries `dpkg` for the target, returns true if installed', () => {
                exec.mockImplementationOnce(() => ({ code: 0 }));

                const target = new Target('target');
                const result = isPackageInstalled(target);

                expect(exec).toBeCalledWith("dpkg -s 'target'");
                expect(log.info).toBeCalledWith(
                    "Verifying target 'target' exists with `dpkg -s 'target'`...'",
                );
                expect(result).toBe(true);
            });

            it('... and false if not installed', () => {
                exec.mockImplementationOnce(() => ({ code: 1 }));

                const target = new Target('target');
                const result = isPackageInstalled(target);

                expect(exec).toBeCalledWith("dpkg -s 'target'");
                expect(log.info).toBeCalledWith(
                    "Verifying target 'target' exists with `dpkg -s 'target'`...'",
                );
                expect(result).toBe(false);
            });
        });

        describe('mac', () => {
            beforeEach(() => {
                isLinux.mockImplementation(() => false);
                isMac.mockImplementation(() => true);
            });

            it('queries `brew list` for the target, returns true if installed', () => {
                const target = new Target('target');
                const result = isPackageInstalled(target);

                expect(exec).toBeCalledWith("brew list --versions 'target'");
                expect(log.info).toBeCalledWith(
                    "Verifying target 'target' exists with `brew list --versions 'target'`...'",
                );
                expect(result).toBe(true);
            });

            it('queries `brew list --cask` for the target if isGUI is set, returns true if installed', () => {
                const target = new Target('target', { isGUI: true });
                const result = isPackageInstalled(target);

                expect(exec).toBeCalledWith("brew list --cask 'target'");
                expect(log.info).toBeCalledWith(
                    "Verifying target 'target' exists with `brew list --cask 'target'`...'",
                );
                expect(result).toBe(true);
            });

            it('... and returns false if not installed', () => {
                exec.mockImplementationOnce(() => ({ code: 1 }));

                const target = new Target('target');
                const result = isPackageInstalled(target);

                expect(exec).toBeCalledWith("brew list --versions 'target'");
                expect(log.info).toBeCalledWith(
                    "Verifying target 'target' exists with `brew list --versions 'target'`...'",
                );
                expect(result).toBe(false);
            });
        });

        describe('other', () => {
            it('throws if the platform is not recognized', () => {
                isLinux.mockImplementationOnce(() => false);
                isMac.mockImplementationOnce(() => false);

                const target = new Target('target');

                expect(() => {
                    isPackageInstalled(target);
                }).toThrowErrorMatchingInlineSnapshot(
                    `"Verification for 'target' failed: Unrecognized platform."`,
                );
            });
        });
    });
});
