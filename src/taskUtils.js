const gulp = require('gulp');
const {
    createNewPackage,
    createNewPhase,
    installPackage,
    isPackageInstalled,
} = require('./packageUtils');

const createPhaseTasks = (phaseDefs) => {
    const phaseTasks = [];

    phaseDefs.forEach((phaseDef) => {
        const phase = createNewPhase(phaseDef);

        const generatedPkgTaskNames = createTasks(
            phase.name,
            phase.action,
            phase.packages,
        );
        const packageTasks = gulp[phase.asyncType](generatedPkgTaskNames);

        phaseTasks.push(packageTasks);
    });

    return phaseTasks;
};

const createTask = (pkg, exp) => {
    const taskName = `${pkg.meta.action}:${pkg.name}`;

    const task = (cb) => {
        if (pkg.meta.skipInstall) {
            log.warn(`Skipping '${pkg.name}'...`);
            cb();
        }

        log.info(`Verifying '${pkg.name}' is installed...`);

        if (!isPackageInstalled(pkg, pkg.meta.testFn)) {
            if (pkg.meta.action === 'install') {
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
            } else if (pkg.meta.action === 'verify') {
                throw new Error(
                    `Package '${pkg.name}' is not installed! (Have you run bootstrap.sh?)`,
                );
            } else {
                throw new Error(
                    `Action '${pkg.meta.action}' for package '${pkg.name}' is not supported.`,
                );
            }
        }

        cb();
    };

    // Export task
    exp && (exp[taskName] = task);

    // Set task display name
    task.displayName = taskName;

    return task;
};

const createTasks = (phaseName, actionType, pkgDefs) => {
    if (actionType === 'verify') {
        return createVerifyTasks(pkgDefs, phaseName);
    } else if (actionType === 'install') {
        return createInstallTasks(pkgDefs, phaseName);
    } else {
        throw new Error('Unsupported actionType');
    }
};

const createVerifyTasks = (pkgDefs, phaseName) => {
    const generatedTaskNames = [];

    pkgDefs.forEach((pkgDef) => {
        const pkg = createNewPackage(pkgDef);
        const taskName = `${phaseName}:verify:${pkg.name}`;

        gulp.task(taskName, (cb) => {
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

const createInstallTasks = (pkgDefs, phaseName) => {
    const generatedTaskNames = [];

    pkgDefs.forEach((pkgDef) => {
        const pkg = createNewPackage(pkgDef);
        const taskName = `${phaseName}:install:${pkg.name}`;

        gulp.task(taskName, (cb) => {
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
    createTask,
    createPhaseTasks,
    createInstallTasks,
    createVerifyTasks,
};
