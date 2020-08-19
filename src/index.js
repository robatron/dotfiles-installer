const { ACTIONS, PLATFORM } = require('./constants');
const { fileExists } = require('./fileUtils');
const { createGlobalLogger } = require('./logger');
const { defineTaskPhase, defineTaskTreeRoot } = require('./phaseUtils');
const { createTaskTree } = require('./taskUtils');

// Create logger for the whole app
createGlobalLogger();

module.exports = {
    ACTIONS,
    defineTaskPhase,
    defineTaskTreeRoot,
    createTaskTree,
    fileExists,
    PLATFORM,
};
