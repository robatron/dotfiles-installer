const gulp = require('gulp');
const {
    createNewPackage,
    createNewPhase,
    installPackage,
    isPackageInstalled,
} = require('./packageUtils');
const { ACTIONS } = require('./constants');

// Create a single task
const createTask = (pkg, exp) => {
    const taskName = `${pkg.meta.action}:${pkg.name}`;

    const task = (cb) => {
        if (pkg.meta.skipInstall) {
            log.warn(`Skipping '${pkg.name}'...`);
            cb();
        }

        log.info(`Verifying '${pkg.name}' is installed...`);

        if (!isPackageInstalled(pkg, pkg.meta.testFn)) {
            if (pkg.meta.action === ACTIONS.INSTALL) {
                log.info(
                    `Package '${pkg.name}' is not installed. Installing...`,
                );
                installPackage(pkg);
            } else if (pkg.meta.action === ACTIONS.VERIFY) {
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

    // Set task display name so the task name displays when running, and export
    // it so it's runnable by itself
    task.displayName = taskName;
    exp && (exp[taskName] = task);

    return task;
};

// TODO
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

module.exports = {
    createTask,
    createPhaseTasks,
};
