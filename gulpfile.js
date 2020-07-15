const { series } = require('gulp');
const PACKAGES = require('./PACKAGES');
const { createGlobalLogger } = require('./src/logger');

const {
    createPhaseTasks,
    createInstallTasks,
    createVerifyTasks,
} = require('./src/taskUtils');

// Init
createGlobalLogger();

exports.default = series(createPhaseTasks(PACKAGES));
