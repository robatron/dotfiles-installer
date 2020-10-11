const fs = require('fs');
const path = require('path');
const rmrf = require('rimraf');
const simpleGit = require('simple-git');
const { getConfig } = require('../configUtils');
const log = require('../log');

// Install the specified target via git
const installGitPackage = async (target) => {
    const {
        actionArgs: { gitPackage, postInstall },
    } = target;

    const { binSymlink, ref, repoUrl } = gitPackage;
    const binDir = gitPackage.binDir
        ? gitPackage.binDir
        : getConfig().binInstallDir;
    const cloneDir = gitPackage.cloneDir
        ? gitPackage.cloneDir
        : path.join(getConfig().gitCloneDir, target.name);

    log.info(`Installing target '${target.name}' via git from '${repoUrl}'...`);

    // Validate good `ref` habits
    if (!ref) {
        throw new Error(
            "A specific `ref` is required. (Use `master` if you're lazy, but it's safer to use a specific ref, e.g., a tag or commit.)",
        );
    } else if (ref === 'master') {
        log.warn(
            'Using `master` as the `ref` is unsafe! Use a specific ref, e.g., a tag or commit.',
        );
    }

    if (fs.existsSync(cloneDir)) {
        const msgPrefix = `Error installing target '${target.name}' from '${repoUrl}'`;
        if (fs.lstatSync(cloneDir).isDirectory()) {
            log.warn(
                `${msgPrefix}. (Is it already installed?) Directory exists: ${cloneDir}`,
            );
        } else {
            throw new Error(`${msgPrefix}. File exists: ${cloneDir}`);
        }
    } else {
        const createdBaseDir = fs.mkdirSync(cloneDir, { recursive: true });

        try {
            log.info(`Cloning ${repoUrl} => ${cloneDir}`);
            const git = simpleGit();
            await git.clone(repoUrl, cloneDir);
            await git.cwd(cloneDir);
            await git.checkout(ref);
        } catch (err) {
            rmrf.sync(createdBaseDir);
            throw new Error(
                `Error cloning '${repoUrl}' for target '${target.name}': ${err}`,
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
            const msgPrefix = `Error symlinking '${binSymSrc}' --> '${binSymDest}'`;
            if (fs.lstatSync(binSymDest).isSymbolicLink()) {
                log.warn(`${msgPrefix}: Symlink exists`);
            } else {
                throw new Error(`${msgPrefix}: File exists`);
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

module.exports = installGitPackage;
