const gulp = require('gulp');
const { installPackage, isPackageInstalled } = require('./packageUtils');
const { ACTIONS } = require('./constants');

// Create a single package task
const createPackageTask = (pkg, exp) => {
    console.log('>>>', pkg); // DEBUGGGG

    const taskName = `${pkg.action}:${pkg.name}`;

    const task = (cb) => {
        if (pkg.skipInstall) {
            log.warn(`Skipping '${pkg.name}'...`);
            cb();
        }

        log.info(`Verifying '${pkg.name}' is installed...`);

        if (!isPackageInstalled(pkg, pkg.testFn)) {
            if (pkg.action === ACTIONS.INSTALL) {
                log.info(
                    `Package '${pkg.name}' is not installed. Installing...`,
                );
                installPackage(pkg);
            } else if (pkg.action === ACTIONS.VERIFY) {
                throw new Error(
                    `Package '${pkg.name}' is not installed! (Have you run bootstrap.sh?)`,
                );
            } else {
                throw new Error(
                    `Action '${pkg.action}' for package '${pkg.name}' is not supported.`,
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

module.exports = {
    createPackageTask,
};
