const PACKAGES = require('./PACKAGES');
const { createGlobalLogger } = require('./src/logger');
const { createPhaseTasks } = require('./src/taskUtils');

createGlobalLogger();
createPhaseTasks(PACKAGES, exports);
