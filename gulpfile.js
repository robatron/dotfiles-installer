const PACKAGES = require('./PACKAGES');
const { createGlobalLogger } = require('./src/logger');
const { createPhaseTasks } = require('./src/taskUtils');

// Init
createGlobalLogger();

exports.allPhases = createPhaseTasks(PACKAGES, exports);

exports.default = exports.allPhases;
