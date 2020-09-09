const { ACTIONS, PHASE_NAME_DEFAULT } = require('./constants');

// Helper function to create a phase definition
const definePhase = (name, action, targets, opts = {}) => [
    name,
    {
        ...opts,
        action,
        targets: targets.filter((target) => target),
    },
];

// Helper function to create the root phase definition with required parameters
// and structure
const defineRoot = (targets, parallel = false) => [
    definePhase(PHASE_NAME_DEFAULT, ACTIONS.RUN_PHASES, targets, {
        parallel,
    }),
];

module.exports = {
    definePhase,
    defineRoot,
};
