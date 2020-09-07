const fs = require('fs');
const path = require('path');
const git = require('nodegit');
const commandExistsSync = require('command-exists').sync;
const shell = require('shelljs');
const { getConfig } = require('./config');
const log = require('./log');
const platform = require('./platformUtils');

// Install the specified package via git
const installPackageViaGit = async (pkg, cloneDir, binDir) => {
    const {
        actionArgs: { binSymlink, gitUrl, postInstall },
    } = pkg;

    if (!cloneDir) {
        const { gitInstallDir } = getConfig();
        cloneDir = path.join(gitInstallDir, pkg.name);
    }

    if (!binDir) {
        const { binInstallDir } = getConfig();
        binDir = binInstallDir;
    }

    if (fs.existsSync(cloneDir)) {
        if (fs.lstatSync(cloneDir).isDirectory()) {
            log.warn(
                `'${gitUrl}' will not be cloned to '${cloneDir}'. Directory exists.`,
            );
        } else {
            throw new Error(
                `Error installing package '${pkg.name}' from '${gitUrl}'. File exists: ${cloneDir}`,
            );
        }
    } else {
        fs.mkdirSync(cloneDir, { recursive: true });

        try {
            await git.Clone(gitUrl, cloneDir);
        } catch (err) {
            throw new Error(
                `Error cloning ${gitUrl} for package '${pkg.name}': ${err}`,
            );
        }
    }

    // If a binSymlink is defined, try to symlink it
    if (binSymlink) {
        const binSymSrc = path.join(cloneDir, binSymlink);
        const binSymDest = path.join(binDir, binSymlink);

        if (!fs.existsSync(binSymSrc)) {
            throw new Error(
                `Error installing package '${pkg.name}'. Bin symlink does not exist in package: ${binSymSrc}`,
            );
        }

        if (fs.existsSync(binSymDest)) {
            if (fs.lstatSync(binSymDest).isSymbolicLink()) {
                log.warn(
                    `'${binSymSrc}' will not be symlinked to '${binSymDest}'. Symlink exists.`,
                );
            } else {
                throw new Error(
                    `Error installing package '${pkg.name}'. File exists: ${binSymDest}`,
                );
            }
        } else {
            fs.mkdirSync(binDir, { recursive: true });
            fs.symlinkSync(binSymSrc, binSymDest);
        }
    }

    // Run any post install steps, pass along pertinant info
    if (postInstall) {
        postInstall(pkg, { gitUrl, cloneDir });
    }
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
