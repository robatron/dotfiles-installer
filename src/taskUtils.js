const gulp = require('gulp');
const {
    createPackage,
    installPackage,
    isPackageInstalled,
} = require('./packageUtils');
const { ACTIONS } = require('./constants');
const Phase = require('./Phase');
const { parallel } = require('gulp');

// Create a single package task
const createPackageTask = (pkg, exp) => {
    const taskName = `${pkg.action}:${pkg.name}`;

    const task = (cb) => {
        if (pkg.skipInstall) {
            log.warn(`Skipping '${pkg.name}'...`);
            cb();
        }

        log.info(`Verifying '${pkg.name}' is installed...`);

        if (!isPackageInstalled(pkg)) {
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

// Recursively create an entire phase task
const createPhaseTask = (phaseDef, exp) => {
    const phase = new Phase(phaseDef[0], phaseDef[1]);

    // Base case to detect a leaf
    if ([ACTIONS.VERIFY, ACTIONS.INSTALL].includes(phase.action)) {
        const asyncType = phase.parallel ? 'parallel' : 'series';
        return gulp[asyncType](
            phase.targets
                .map((pkgDef) => createPackage(pkgDef, ACTIONS.VERIFY))
                .map((pkg) => createPackageTask(pkg, exports)),
        );
    }
};

module.exports = {
    createPackageTask,
    createPhaseTask,
};
