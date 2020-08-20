const { ACTIONS } = require('./constants');
const { fileExists } = require('./fileUtils');
const { createGlobalLogger } = require('./logger');
const { defineTaskPhase, defineTaskTreeRoot } = require('./phaseUtils');
const { isMac, isLinux } = require('./platformUtils');
const { createTaskTree } = require('./taskUtils');

// Create logger for the whole app
createGlobalLogger();

module.exports = {
    ACTIONS,
    createTaskTree,
    defineTaskPhase,
    defineTaskTreeRoot,
    fileExists,
    isLinux,
    isMac,
};
