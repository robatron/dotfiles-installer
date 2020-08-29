const { getConfig, setConfig } = require('./config');
const { ACTIONS } = require('./constants');
const { fileExists } = require('./fileUtils');
const { createGlobalLogger } = require('./logger');
const { definePhase, defineRoot } = require('./phaseUtils');
const { isMac, isLinux } = require('./platformUtils');
const { createTaskTree } = require('./taskUtils');

// Create logger for the whole app
createGlobalLogger();

module.exports = {
    ACTIONS,
    createTaskTree,
    definePhase,
    defineRoot,
    fileExists,
    getConfig,
    isLinux,
    isMac,
    setConfig,
};
