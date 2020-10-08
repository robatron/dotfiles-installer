module.exports = {
    // Phase name constants
    PHASE_NAME_DEFAULT: 'default',
    PHASE_NAME_DELIM: ':',

    // Actions that can be performed on supported targets of a phase
    ACTIONS: {
        // Treat targets as jobs to execute
        EXECUTE_JOBS: 'execute-job',

        // Treat targets as packages, install them if they're not already
        INSTALL_PACKAGES: 'install',

        // Treat targets as phases and run them
        RUN_PHASES: 'run-tasks',

        // Treat targets as packages, fail if they are not installed
        VERIFY_PACKAGES: 'verify',
    },
};
