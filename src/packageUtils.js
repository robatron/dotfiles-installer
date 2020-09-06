const fs = require('fs');
const path = require('path');
const git = require('nodegit');
const commandExistsSync = require('command-exists').sync;
const shell = require('shelljs');
const { getConfig } = require('./config');
const log = require('./log');
const platform = require('./platformUtils');

// Install the specified package via git
const installPackageViaGit = (pkg, cloneDir, binDir) => {
    const {
        actionArgs: { binSymlink, gitUrl, postInstall },
    } = pkg;

    if (!cloneDir) {
        const { gitInstallDir } = getConfig();
        cloneDir = gitInstallDir;
    }

    if (!binDir) {
        const { binInstallDir } = getConfig();
        binDir = binInstallDir;
    }

    // Make sure the filesystem is ready for cloning
    if (fs.existsSync(cloneDir)) {
        if (fs.lstatSync(cloneDir).isDirectory()) {
            log.warn(
                `'${gitUrl}' will not be cloned to '${cloneDir}'. Directory exists.`,
            );
            return;
        } else {
            log.error(
                `Error installing package '${pkg.name}' from '${gitUrl}'. File exists.`,
            );
            return process.exit(1);
        }
    }
    fs.mkdirSync(cloneDir, { recursive: true });

    return git
        .Clone(gitUrl, cloneDir)
        .then(() => {
            // If a binSymlink is defined, try to symlink it
            const binSymSrc = path.join(cloneDir, binSymlink);
            const binSymDest = path.join(binDir, binSymlink);

            if (!fs.existsSync(binSymSrc)) {
                log.error(
                    `Error installing package '${pkg.name}'. Bin symlink '${binSymSrc}' does not exist.`,
                );
                return process.exit(1);
            }

            if (fs.existsSync(binSymDest)) {
                if (fs.lstatSync(binDir).isSymbolicLink()) {
                    log.warn(
                        `'${binSymSrc}' will not be symlinked to '${binSymDest}'. Symlink exists.`,
                    );
                    return;
                } else {
                    log.error(
                        `Error installing package '${pkg.name}'. '${binSymDest}' file exists.`,
                    );
                    return process.exit(1);
                }
            }

            fs.mkdirSync(binDir, { recursive: true });
            fs.symlinkSync(binSymSrc, binSymDest);
        })
        .then(() => {
            // Run any post install steps, pass along pertinant info
            if (postInstall) {
                postInstall(pkg, { gitUrl, destDir: cloneDir });
            }
        })
        .catch((err) => {
            log.error(`Error installing package '${pkg.name}': ${err}`);
            return process.exit(1);
        });
};

// Install the specified package
const installPackage = (pkg) => {
    const { installCommands, postInstall } = pkg.actionArgs;
    const cmds = [];

    // Use explicit install commands if specified
    if (installCommands) {
        installCommands.forEach((cmd) => cmds.push(cmd));
    }

    // Install via the system package managers
    else if (platform.isLinux()) {
        cmds.push(`sudo apt install -y ${pkg.name}`);
    } else if (platform.isMac()) {
        cmds.push(`brew install ${pkg.name}`);
    }

    // Error if we don't know how to install this package
    else {
        throw new Error(
            `Cannot determine install command(s) for package '${pkg.name}'`,
        );
    }

    // Run install commands
    cmds.forEach((cmd) => {
        const returnCode = shell.exec(cmd).code;
        if (returnCode !== 0) {
            const fullCommandMessage =
                cmds.length > 1
                    ? ` Full command set: ${JSON.stringify(cmds)}`
                    : '';
            throw new Error(
                `Install command '${cmd}' failed for package '${pkg.name}'.${fullCommandMessage}`,
            );
        }
    });

    // Run any post install steps
    if (postInstall) {
        postInstall(pkg);
    }
};

// Return if a package is installed or not
const isPackageInstalled = (pkg) => {
    const { testFn } = pkg.actionArgs;

    // If custom test function supplied, use it
    if (testFn) {
        log.info(`Using custom test to verify '${pkg.name}' is installed...`);

        if (!testFn(pkg)) {
            log.info(
                `Custom test for '${pkg.name}' failed. Assuming not installed...`,
            );
            return false;
        }
        return true;
    }

    // Otherwise, just see if the command exists in the environment
    return commandExistsSync(pkg.command);
};

module.exports = {
    installPackage,
    installPackageViaGit,
    isPackageInstalled,
};
