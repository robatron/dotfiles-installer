const { ACTIONS, PHASE_NAME_DEFAULT } = require('./constants');

// Helper function to create a phase definition
const defineTaskPhase = (name, action, targets, opts = {}) => [
    name,
    {
        ...opts,
        action,
        targets,
    },
];

// Helper function to create the root phase definition with required parameters
// and structure
const defineTaskTreeRoot = (targets, parallel = false) => [
    defineTaskPhase(PHASE_NAME_DEFAULT, ACTIONS.RUN_PHASES, targets, {
        parallel,
    }),
];

module.exports = {
    defineTaskPhase,
    defineTaskTreeRoot,
};
