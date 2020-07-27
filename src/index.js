const { ACTIONS, PLATFORM } = require('./constants');
const { fileExists } = require('./fileUtils');
const { createGlobalLogger } = require('./logger');
const { createPhaseDef, createPhaseDefTreeRoot } = require('./phaseUtils');
const { createPhaseTaskTree } = require('./taskUtils');

// Create logger for the whole app
createGlobalLogger();

module.exports = {
    ACTIONS,
    createPhaseDef,
    createPhaseDefTreeRoot,
    createPhaseTaskTree,
    fileExists,
    PLATFORM,
};
