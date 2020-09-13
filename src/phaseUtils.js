const { ACTIONS, PHASE_NAME_DEFAULT } = require('./constants');

// Helper function to create a package definition
const definePackage = (name, args = {}) => [name, args];

// Helper function to create a phase definition
const definePhase = (name, action, targets, opts = {}) => [
    name,
    {
        ...opts,
        action,
        targets: targets.filter((target) => target),
    },
];

// Helper function to create the root phase definition with required parameters
// and structure. Inject `verifyPrereqsPhase` as the first phase on the root.
const defineRoot = (targets, parallel = false) => [
    definePhase(
        PHASE_NAME_DEFAULT,
        ACTIONS.RUN_PHASES,
        [verifyPrereqsPhase, ...targets],
        {
            parallel,
        },
    ),
];

// Phase for verifying akinizer prerequisites are installed
const verifyPrereqsPhase = definePhase(
    'verifyPrereqsPhase',
    ACTIONS.VERIFY,
    [
        definePackage('curl'),
        definePackage('git'),
        definePackage('node'),
        definePackage('npm'),
    ],
    { parallel: true },
);

module.exports = {
    definePackage,
    definePhase,
    defineRoot,
};
