const { ACTIONS, PLATFORM } = require('./constants');
const { fileExists } = require('./fileUtils');
const { createGlobalLogger } = require('./logger');
const { createPhaseDef, createPhaseTreeDef } = require('./phaseUtils');
const { createPhaseTreeTasks } = require('./taskUtils');

// Create logger for the whole app
createGlobalLogger();

module.exports = {
    ACTIONS,
    createPhaseDef,
    createPhaseTreeDef,
    createPhaseTreeTasks,
    fileExists,
    PLATFORM,
};
