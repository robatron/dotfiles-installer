const os = require('os');
const path = require('path');

module.exports = {
    // Phase name constants
    PHASE_NAME_DEFAULT: 'default',
    PHASE_NAME_DELIM: ':',

    // Actions that can be performed on supported targets of a phase
    ACTIONS: {
        // Treat targets as jobs to execute
        EXECUTE_JOBS: 'execute-jobs',

        // Treat targets as packages, install them if they're not already
        INSTALL_PACKAGES: 'install-packages',

        // Treat targets as phases and run them
        RUN_PHASES: 'run-tasks',

        // Treat targets as packages, fail if they are not installed
        VERIFY_PACKAGES: 'verify-packages',
    },

    // Default configurations for anything not included in the .akinizerrc.js
    // config file
    DEFAULT_CONFIGS: {
        // Directory in which to install user-space binaries
        binInstallDir: path.join(os.homedir(), 'bin'),

        // Directory in which to install user-space git packages
        gitCloneDir: path.join(os.homedir(), 'opt'),
    },
};
