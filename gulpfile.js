const path = require('path');
const { series, parallel } = require('gulp');
const PACKAGES = require('./PACKAGES');
const { ACTIONS } = require('./src/constants');
const { fileExists } = require('./src/fileUtils');
const { createGlobalLogger } = require('./src/logger');
const { createPackageTask, createPhaseTask } = require('./src/taskUtils');
const { createPackage } = require('./src/packageUtils');

// Init
createGlobalLogger();

const verifyPrereqPhaseDef = PACKAGES[0][1].targets[0];

exports.verifyPhase = createPhaseTask(verifyPrereqPhaseDef, exports);

exports.default = series(exports.verifyPhase);
