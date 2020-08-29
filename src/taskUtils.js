const gulp = require('gulp');
const {
    installPackageViaGit,
    installPackage,
    isPackageInstalled,
} = require('./packageUtils');
const {
    ACTIONS,
    PHASE_NAME_DEFAULT,
    PHASE_NAME_DELIM,
} = require('./constants');
const Phase = require('./Phase');
const { createPackage } = require('./Package');

// Create a single package task
const createPackageTask = (pkg, exp, phaseName) => {
    const task = (cb) => {
        if (pkg.skipAction) {
            log.warn(`Skipping '${pkg.name}'...`);
            return cb();
        }

        log.info(`Verifying '${pkg.name}' is installed...`);

        if (!isPackageInstalled(pkg)) {
            log.info(`Package '${pkg.name}' is not installed`);
            if (pkg.action === ACTIONS.INSTALL) {
                if (pkg.gitUrl) {
                    log.info(
                        `Installing package '${pkg.name}' via git from '${pkg.gitUrl}'...`,
                    );
                    installPackageViaGit(pkg);
                } else {
                    log.info(`Installing package '${pkg.name}'...`);
                    installPackage(pkg);
                }
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

    // Create the actual gulp task and expose it globally so it can be run
    // individually
    task.displayName = [phaseName, pkg.action, pkg.name].join(PHASE_NAME_DELIM);
    exp && (exp[task.displayName] = task);

    return task;
};

// Create a single phase task
const createPhaseTask = (phaseDef, exp, phasePrefix = null) => {
    const phaseName = phaseDef[0];
    const phaseOpts = phaseDef[1];
    const phaseNameFull =
        (phasePrefix &&
        // Don't prefix phase names with default phase
        phasePrefix !== PHASE_NAME_DEFAULT
            ? `${phasePrefix}${PHASE_NAME_DELIM}`
            : '') + phaseName;
    const phase = new Phase(phaseNameFull, phaseOpts);
    const asyncType = phase.parallel ? 'parallel' : 'series';
    let phaseTargetTasks;

    // Don't allow phases without targets
    if (phase.targets.length < 1) {
        throw new Error(
            `Missing targets for phase "${phaseNameFull}" with action "${phase.action}"`,
        );
    }

    // Recursively build phase tasks. Base case: Targets are packages
    if ([ACTIONS.VERIFY, ACTIONS.INSTALL].includes(phase.action)) {
        phaseTargetTasks = phase.targets
            .map((pkgDef) => createPackage(pkgDef, phase.action))
            .map((pkg) => createPackageTask(pkg, exp, phase.name));
    } else if (phase.action === ACTIONS.RUN_PHASES) {
        phaseTargetTasks = createTaskTree(phase.targets, exp, phase.name);
    } else {
        throw new Error(`Unsupported action: ${phase.action}`);
    }

    // Create the actual gulp combination task and expose it globally so it can
    // be run individually
    const phaseTask = gulp[asyncType](phaseTargetTasks);
    phaseTask.displayName = phase.name;
    exp && (exp[phase.name] = phaseTask);

    return phaseTask;
};

// Recursively create an phase task tree based on the specified definition
const createTaskTree = (phaseDefs, exp, phaseNamePrefix = null) =>
    phaseDefs.map((phaseDef) =>
        createPhaseTask(phaseDef, exp, phaseNamePrefix),
    );

module.exports = {
    createPackageTask,
    createPhaseTask,
    createTaskTree,
};
