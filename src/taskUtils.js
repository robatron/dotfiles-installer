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

// Recursively create an phase task tree based on the specified definition
const createPhaseTasks = (phaseDefs, exp) => {
    const phaseTasks = [];

    for (let i = 0; i < phaseDefs.length; ++i) {
        const phaseDef = phaseDefs[i];
        const phase = new Phase(phaseDef[0], phaseDef[1]);
        const asyncType = phase.parallel ? 'parallel' : 'series';
        let phaseTargetTasks;

        // Recursively build phase tasks. Base case: Targets are packages
        if ([ACTIONS.VERIFY, ACTIONS.INSTALL].includes(phase.action)) {
            phaseTargetTasks = phase.targets
                .map((pkgDef) => createPackage(pkgDef, phase.action))
                .map((pkg) => createPackageTask(pkg, exports));
        } else if (phase.action === ACTIONS.RUN_PHASES) {
            phaseTargetTasks = createPhaseTasks(phase.targets, exp);
        } else {
            throw new Error(`Unsupported action: ${phase.action}`);
        }

        const phaseTask = gulp[asyncType](phaseTargetTasks);
        phaseTask.displayName = phase.name;
        exp && (exp[phase.name] = phaseTask);

        phaseTasks.push(phaseTask);
    }

    return phaseTasks;
};

module.exports = {
    createPackageTask,
    createPhaseTasks,
};
