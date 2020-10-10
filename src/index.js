const { getConfig } = require('./configUtils');
const { ACTIONS } = require('./constants');
const { fileExists } = require('./fileUtils');
const { definePackage, definePhase, defineRoot } = require('./phaseUtils');
const { isMac, isLinux } = require('./platformUtils');
const { createTaskTree } = require('./taskUtils');

module.exports = {
    ACTIONS,
    createTaskTree,
    definePackage,
    definePhase,
    defineRoot,
    fileExists,
    getConfig,
    isLinux,
    isMac,
};
