module.exports = {
    // Actions that can be performed on supported targets of a phase
    ACTIONS: {
        // Verify a package is installed
        VERIFY: 'verify',

        // Install a package if it is not already
        INSTALL: 'install',

        // Run a phase
        RUN_PHASES: 'run-tasks',
    },

    // Operating system
    PLATFORM: {
        IS_MAC: process.platform === 'darwin',
        IS_LINUX: process.platform === 'linux',
    },
};
