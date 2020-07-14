const { series } = require('gulp');
const { PREREQ_PACKAGES, PYTHON_PACKAGES } = require('./PACKAGES');
const { createGlobalLogger } = require('./src/logger');

const { createInstallTasks, createVerifyTasks } = require('./src/taskUtils');

// Init
createGlobalLogger();

exports.verifyPrereqPackages = series(createVerifyTasks(PREREQ_PACKAGES));
exports.installPythonPackages = series(createInstallTasks(PYTHON_PACKAGES));

exports.default = series(
    exports.verifyPrereqPackages,
    exports.installPythonPackages,
);
