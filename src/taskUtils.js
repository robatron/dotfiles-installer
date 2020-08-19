const gulp = require('gulp');
const { installPackage, isPackageInstalled } = require('./packageUtils');
const { ACTIONS, PHASE_NAME_DEFAULT } = require('./constants');
const Phase = require('./Phase');
const { createPackage } = require('./Package');

// Create a single package task
const createPackageTask = (pkg, exp, taskNamePrefix) => {
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
    task.displayName = [taskNamePrefix, pkg.action, pkg.name].join(':');
    exp && (exp[task.displayName] = task);

    return task;
};

// Create a single phase task
const createPhaseTask = (phaseDef, exp, phaseNamePrefix) => {
    const phaseName = phaseDef[0];
    const phaseOpts = phaseDef[1];
    const phaseNameFull =
        (phaseNamePrefix && phaseNamePrefix !== PHASE_NAME_DEFAULT
            ? `${phaseNamePrefix}:`
            : '') + phaseName;
    const phase = new Phase(phaseNameFull, phaseOpts);
    const asyncType = phase.parallel ? 'parallel' : 'series';
    let phaseTargetTasks;

    // Recursively build phase tasks. Base case: Targets are packages
    if ([ACTIONS.VERIFY, ACTIONS.INSTALL].includes(phase.action)) {
        phaseTargetTasks = phase.targets
            .map((pkgDef) => createPackage(pkgDef, phase.action))
            .map((pkg) => createPackageTask(pkg, exp, phase.name));
    } else if (phase.action === ACTIONS.RUN_PHASES) {
        phaseTargetTasks = createPhaseTreeTasks(phase.targets, exp, phase.name);
    } else {
        throw new Error(`Unsupported action: ${phase.action}`);
    }

    const phaseTask = gulp[asyncType](phaseTargetTasks);
    phaseTask.displayName = phase.name;
    exp && (exp[phase.name] = phaseTask);

    return phaseTask;
};

// Recursively create an phase task tree based on the specified definition
const createPhaseTreeTasks = (phaseDefs, exp, phaseNamePrefix) =>
    phaseDefs.map((phaseDef) =>
        createPhaseTask(phaseDef, exp, phaseNamePrefix),
    );

module.exports = {
    createPackageTask,
    createPhaseTask,
    createPhaseTreeTasks,
};
