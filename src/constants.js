module.exports = {
    // Phase name constants
    PHASE_NAME_DEFAULT: 'default',
    PHASE_NAME_DELIM: ':',

    // Actions that can be performed on supported targets of a phase
    ACTIONS: {
        // Install a package if it is not already
        INSTALL: 'install',

        // Run a phase
        // TODO: Make this automatic
        RUN_PHASES: 'run-tasks',

        // Verify a package is installed
        VERIFY: 'verify',
    },
};
