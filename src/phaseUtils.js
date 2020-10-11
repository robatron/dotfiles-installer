const { ACTIONS, PHASE_NAME_DEFAULT } = require('./constants');

// Helper function to create a phase definition
const definePhase = (name, action, targets, phaseOpts = {}) => [
    name,
    {
        ...phaseOpts,
        action,
        targets: targets.filter((target) => target),
    },
];

// Helper function to create the root phase definition with required parameters
// and structure. Inject `verifyPrereqsPhase` as the first phase on the root.
const defineRoot = (targets, parallel = false) => [
    definePhase(PHASE_NAME_DEFAULT, ACTIONS.RUN_PHASES, targets, {
        parallel,
    }),
];

// Helper function to create a target definition
const defineTarget = (name, args = {}) => [name, args];

module.exports = {
    definePhase,
    defineRoot,
    defineTarget,
};
