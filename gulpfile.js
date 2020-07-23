const PACKAGES = require('./PACKAGES');
const { createGlobalLogger } = require('./src/logger');
const { createPhaseTaskTree } = require('./src/taskUtils');

createGlobalLogger();

// Create the full gulp task tree from the package definitions
createPhaseTaskTree(PACKAGES, exports);
