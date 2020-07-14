const { task } = require('gulp');
const { installPackage, isPackageInstalled } = require('./assureInstalled');
const Package = require('./Package');

// Create a new package object from a definition
const createNewPackage = (pkg) => {
    if (typeof pkg === 'string') {
        return new Package(pkg);
    } else if (Array.isArray(pkg)) {
        const pkgName = pkg[0];
        const pkgMeta = pkg[1];
        return new Package(pkgName, pkgMeta);
    } else {
        throw new Error(`Malformed package definition: ${JSON.stringify(pkg)}`);
    }
};

const createVerifyTasks = (pkgDefs) => {
    const generatedTaskNames = [];

    pkgDefs.forEach((pkgDef) => {
        const pkg = createNewPackage(pkgDef);
        const taskName = `verifyPackage:${pkg.name}`;

        task(taskName, (cb) => {
            log.info(`Verifying '${pkg.name}' is installed...`);

            if (!isPackageInstalled(pkg, pkg.meta.testFn)) {
                throw new Error(
                    `Package '${pkg.name}' is not installed! (Have you run bootstrap.sh?)`,
                );
            }

            cb();
        });

        generatedTaskNames.push(taskName);
    });

    return generatedTaskNames;
};

const createInstallTasks = (pkgDefs) => {
    const generatedTaskNames = [];

    pkgDefs.forEach((pkgDef) => {
        const pkg = createNewPackage(pkgDef);
        const taskName = `installPackage:${pkg.name}`;

        task(taskName, (cb) => {
            if (pkg.meta.skipInstall) {
                log.warn(`Skipping '${pkg.name}'...`);
                cb();
            }

            log.info(`Verifying '${pkg.name}' is installed...`);

            if (!isPackageInstalled(pkg, pkg.meta.testFn)) {
                log.info(
                    `Package '${pkg.name}' is not installed. Installing...`,
                );

                const installError = installPackage(pkg);

                if (installError) {
                    log.warn(installError);
                    throw new Error(
                        `Error installing package '${pkg.name}': ${installError}`,
                    );
                }
            }

            cb();
        });

        generatedTaskNames.push(taskName);
    });

    return generatedTaskNames;
};

module.exports = {
    createInstallTasks,
    createVerifyTasks,
};
