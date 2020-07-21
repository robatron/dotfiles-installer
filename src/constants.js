module.exports = {
    // Supported actions that can be performed on targets of a phase
    ACTIONS: {
        VERIFY: 'verify',
        INSTALL: 'install',
        RUN_PHASES: 'run-tasks',
    },

    // Operating system
    PLATFORM: {
        IS_MAC: process.platform === 'darwin',
        IS_LINUX: process.platform === 'linux',
    },
};
