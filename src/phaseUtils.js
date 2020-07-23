const { ACTIONS } = require('./constants');

// Helper function to create a phase definition
const createPhaseDef = (name, action, targets, opts = {}) => [
    name,
    {
        action,
        targets,
        ...opts,
    },
];

// Helper function to create the root phase definition with required parameters
// and structure
const createPhaseDefTreeRoot = (targets, parallel = false) => [
    ['default', { action: ACTIONS.RUN_PHASES, parallel, targets }],
];

module.exports = {
    createPhaseDef,
    createPhaseDefTreeRoot,
};
