const gulp = require('gulp');
const { installPackage, isPackageInstalled } = require('./packageUtils');
const { ACTIONS } = require('./constants');
const Phase = require('./Phase');
const { createPackage } = require('./Package');

// Create a single package task
const createPackageTask = (pkg, exp, taskNamePrefix) => {
    const taskName = `${taskNamePrefix ? `${taskNamePrefix}:` : ''}${
        pkg.action
    }:${pkg.name}`;

    const task = (cb) => {
        if (pkg.skipAction) {
            log.warn(`Skipping '${pkg.name}'...`);
            return cb();
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

        return cb();
    };

    // Set task display name so the task name displays when running, and export
    // it so it's runnable by itself
    task.displayName = taskName;
    exp && (exp[taskName] = task);

    return task;
};

// Create a single phase task
const createPhaseTask = (phaseDef, exp) => {
    const phaseName = phaseDef[0];
    const phaseOpts = phaseDef[1];
    const phase = new Phase(phaseName, phaseOpts);
    const asyncType = phase.parallel ? 'parallel' : 'series';
    let phaseTargetTasks;

    // Recursively build phase tasks. Base case: Targets are packages
    if ([ACTIONS.VERIFY, ACTIONS.INSTALL].includes(phase.action)) {
        phaseTargetTasks = phase.targets
            .map((pkgDef) => createPackage(pkgDef, phase.action))
            .map((pkg) => createPackageTask(pkg, exp, phase.name));
    } else if (phase.action === ACTIONS.RUN_PHASES) {
        phaseTargetTasks = createPhaseTreeTasks(phase.targets, exp);
    } else {
        throw new Error(`Unsupported action: ${phase.action}`);
    }

    const phaseTask = gulp[asyncType](phaseTargetTasks);
    phaseTask.displayName = phase.name;
    exp && (exp[phase.name] = phaseTask);

    return phaseTask;
};

// Recursively create an phase task tree based on the specified definition
const createPhaseTreeTasks = (phaseDefs, exp) =>
    phaseDefs.map((phaseDef) => createPhaseTask(phaseDef, exp));

module.exports = {
    createPackageTask,
    createPhaseTask,
    createPhaseTreeTasks,
};
