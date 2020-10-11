const { getConfig } = require('./configUtils');
const { ACTIONS } = require('./constants');
const { fileExists } = require('./fileUtils');
const { definePhase, defineRoot, defineTarget } = require('./phaseUtils');
const { isMac, isLinux } = require('./platformUtils');
const { createTaskTree } = require('./taskUtils');

module.exports = {
    ACTIONS,
    createTaskTree,
    definePhase,
    defineRoot,
    defineTarget,
    fileExists,
    getConfig,
    isLinux,
    isMac,
};
