const gulp = require('gulp');
const log = require('./log');
const actionHandlers = require('./actionHandlers');
const {
    ACTIONS,
    PHASE_NAME_DEFAULT,
    PHASE_NAME_DELIM,
} = require('./constants');
const Phase = require('./Phase');
const { createTargetFromDef } = require('./Target');

// Create a single target task
const createPackageFromDefTask = (target, exp, phaseName) => {
    const {
        action,
        actionArgs: { skipAction, skipActionMessage },
        name,
    } = target;

    // Define the actual gulp task
    const task = (done) => {
        // Skip action and log the reason if specified
        if (skipAction && skipAction(target)) {
            let logMsg = `Skipping action '${action}' for target '${name}'`;

            if (skipActionMessage && skipActionMessage(target)) {
                logMsg += `: ${skipActionMessage(target)}`;
            }

            log.warn(logMsg);

            return done();
        }

        // Run the action handler against the target, throw if it doesn't exist.
        try {
            actionHandlers[action](target);
        } catch (e) {
            throw new Error(
                `Action '${action}' for target '${name}' is not supported: ${e}`,
            );
        }

        return done();
    };

    // Create the actual gulp task and expose it globally so it can be run
    // individually
    task.displayName = [phaseName, name].join(PHASE_NAME_DELIM);
    exp && (exp[task.displayName] = task);

    log.debug(`Task '${task.displayName}' created`);

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
            `Missing targets for phase '${phaseNameFull}' with action '${phase.action}'`,
        );
    }

    // Recursively build phase tasks
    if (phase.action === ACTIONS.RUN_PHASES) {
        phaseTargetTasks = createTaskTree(phase.targets, exp, phase.name);
    } else {
        phaseTargetTasks = phase.targets
            .map((targetDef) =>
                createTargetFromDef(targetDef, phase.action, phase.targetOpts),
            )
            .map((target) => createPackageFromDefTask(target, exp, phase.name));
    }

    // Create the actual gulp combination task and expose it globally so it can
    // be run individually
    const phaseTask = gulp[asyncType](phaseTargetTasks);
    phaseTask.displayName = phase.name;
    exp && (exp[phase.name] = phaseTask);

    log.debug(`Phase '${phase.name}' created, tasks will run in ${asyncType}`);

    return phaseTask;
};

// Recursively create an phase task tree based on the specified definition
const createTaskTree = (phaseDefs, exp, phaseNamePrefix = null) =>
    phaseDefs.map((phaseDef) =>
        createPhaseTask(phaseDef, exp, phaseNamePrefix),
    );

module.exports = {
    createPackageFromDefTask,
    createPhaseTask,
    createTaskTree,
};
