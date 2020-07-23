const { ACTIONS } = require('./constants');

// Helper function to create a phase definition
const createPhaseDef = (name, action, targets, opts = {}) => [
    name,
    {
        ...opts,
        action,
        targets,
    },
];

// Helper function to create the root phase definition with required parameters
// and structure
const createPhaseDefTreeRoot = (targets, parallel = false) => [
    createPhaseDef('default', ACTIONS.RUN_PHASES, targets, { parallel }),
];

module.exports = {
    createPhaseDef,
    createPhaseDefTreeRoot,
};
