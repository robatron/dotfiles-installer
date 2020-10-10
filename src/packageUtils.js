const fs = require('fs');
const path = require('path');
const rmrf = require('rimraf');
const git = require('nodegit');
const commandExistsSync = require('command-exists').sync;
const { exec } = require('shelljs');
const { getConfig } = require('./configUtils');
const { execCommands } = require('./execUtils');
const log = require('./log');
const { isLinux, isMac } = require('./platformUtils');

// Install the specified target via git
const installPackageViaGit = async (target) => {
    const {
        actionArgs: { gitPackage, postInstall },
    } = target;

    const { binSymlink, repoUrl } = gitPackage;
    const binDir = gitPackage.binDir
        ? gitPackage.binDir
        : getConfig().binInstallDir;
    const cloneDir = gitPackage.cloneDir
        ? gitPackage.cloneDir
        : path.join(getConfig().gitCloneDir, target.name);

    log.info(
        `Installing target '${target.name}' via git from '${gitPackage.repoUrl}'...`,
    );

    if (fs.existsSync(cloneDir)) {
        if (fs.lstatSync(cloneDir).isDirectory()) {
            log.warn(
                `'${repoUrl}' will not be cloned to '${cloneDir}'. Directory exists.`,
            );
        } else {
            throw new Error(
                `Error installing target '${target.name}' from '${repoUrl}'. File exists: ${cloneDir}`,
            );
        }
    } else {
        const createdBaseDir = fs.mkdirSync(cloneDir, { recursive: true });

        try {
            log.info(`Cloning ${repoUrl} => ${cloneDir}`);
            await git.Clone(repoUrl, cloneDir);
        } catch (err) {
            rmrf.sync(createdBaseDir);
            throw new Error(
                `Error cloning ${repoUrl} for target '${target.name}': ${err}`,
            );
        }
    }

    // If a binSymlink is defined, try to symlink it
    if (binSymlink) {
        const binSymSrc = path.join(cloneDir, binSymlink);
        const binSymDest = path.join(binDir, binSymlink);

        log.info(`Symlinking ${binSymSrc} --> ${binSymDest}...`);

        if (!fs.existsSync(binSymSrc)) {
            throw new Error(
                `Error installing target '${target.name}'. Bin symlink does not exist in target: ${binSymSrc}`,
            );
        }

        if (fs.existsSync(binSymDest)) {
            if (fs.lstatSync(binSymDest).isSymbolicLink()) {
                log.warn(
                    `'${binSymSrc}' will not be symlinked to '${binSymDest}'. Symlink exists.`,
                );
            } else {
                throw new Error(
                    `Error installing target '${target.name}'. File exists: ${binSymDest}`,
                );
            }
        } else {
            fs.mkdirSync(binDir, { recursive: true });
            fs.symlinkSync(binSymSrc, binSymDest);
        }
    }

    // Run any post install steps, pass along pertinant info
    if (postInstall) {
        log.info(`Running post install steps for ${target.name}...`);
        postInstall(target);
    }
};

// Install the specified target
const installPackage = (target) => {
    const { actionCommands, isGUI, postInstall } = target.actionArgs;
    const cmds = [];

    log.info(`Installing target '${target.name}'...`);

    // Use explicit install commands if specified
    if (actionCommands) {
        actionCommands.forEach((cmd) => cmds.push(cmd));
    }

    // Install via the system target managers
    else if (isLinux()) {
        cmds.push(`sudo apt install -y ${target.name}`);
    } else if (isMac()) {
        if (isGUI) {
            cmds.push(
                `HOMEBREW_NO_AUTO_UPDATE=1 brew cask install ${target.name}`,
            );
        } else {
            cmds.push(`HOMEBREW_NO_AUTO_UPDATE=1 brew install ${target.name}`);
        }
    }

    // Error if we don't know how to install this target
    else {
        throw new Error(
            `Cannot determine install command(s) for target '${target.name}'`,
        );
    }

    // Run install commands
    execCommands(cmds);

    // Run any post install steps
    if (postInstall) {
        log.info(`Running post-install scripts for ${target.name}...`);
        postInstall(target);
    }
};

// Return if a target is installed or not
const isPackageInstalled = (target) => {
    const {
        gitPackage,
        actionCommands,
        isGUI,
        verifyCommandExists,
    } = target.actionArgs;

    // If this is a git target, check if its cloned, and its binaries exist
    if (gitPackage) {
        log.info(`Verifying git target '${target.name}'...'`);
        const { binSymlink } = gitPackage;

        const binDir = gitPackage.binDir
            ? gitPackage.binDir
            : getConfig().binInstallDir;
        const cloneDir = gitPackage.cloneDir
            ? gitPackage.cloneDir
            : path.join(getConfig().gitCloneDir, target.name);

        const isCloneDirPresent =
            fs.existsSync(cloneDir) && fs.lstatSync(cloneDir).isDirectory();

        let areBinsPresent = true;
        if (binSymlink) {
            const binSrc = path.join(cloneDir, binSymlink);
            const binDst = path.join(binDir, binSymlink);
            areBinsPresent =
                fs.existsSync(binSrc) &&
                fs.existsSync(binDst) &&
                fs.lstatSync(binDst).isSymbolicLink();
        }

        if (isCloneDirPresent && areBinsPresent) {
            return true;
        }

        return false;
    }

    // If the target has custom install commands, or verifyCommandExists is
    // explicitly set, verify the commang exists in the environment as oppose
    // to verifying the target is installed via the system target manager.
    if (actionCommands || verifyCommandExists) {
        log.info(`Verifying command '${target.name}' exists...'`);
        return commandExistsSync(target.command);
    }

    // Otherwise, test if the target is installed via the system target manager.
    let cmd;

    if (isLinux()) {
        cmd = `dpkg -s '${target.name}'`;
    } else if (isMac()) {
        if (isGUI) {
            cmd = `brew list --cask '${target.name}'`;
        } else {
            cmd = `brew list --versions '${target.name}'`;
        }
    } else {
        throw new Error(
            `Verification for '${target.name}' failed: Unrecognized platform.`,
        );
    }

    log.info(`Verifying target '${target.name}' exists with \`${cmd}\`...'`);
    return !exec(cmd).code;
};

module.exports = {
    installPackage,
    installPackageViaGit,
    isPackageInstalled,
};
