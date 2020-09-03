const fs = require('fs');
const path = require('path');
const git = require('nodegit');
const commandExistsSync = require('command-exists').sync;
const shell = require('shelljs');
const { getConfig } = require('./config');
const log = require('./log');
const platform = require('./platformUtils');

// Install the specified package via git
const installPackageViaGit = (
    pkg,
    destDir = path.join(getConfig().gitInstallDir, name),
) => {
    const {
        name,
        actionArgs: { gitUrl, postInstall },
    } = pkg;

    const createdFilePath = fs.mkdirSync(destDir, { recursive: true });
    if (!createdFilePath) {
        log.warn(
            `Package "${name}" not installed from "${gitUrl}". Directory "${destDir}" exists. Delete the directory to install.`,
        );
        return Promise.resolve();
    }

    return git
        .Clone(gitUrl, destDir)
        .then(() => {
            // Run any post install steps
            if (postInstall) {
                postInstall(pkg);
            }
        })
        .catch((err) => {
            log.error(`Error installing package '${pkg.name}': ${err}`);
            process.exit(1);
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
