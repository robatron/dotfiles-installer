const {
    ACTIONS,
    createTaskTree,
    definePhase,
    defineRoot,
} = require('../../src');

// Create the phase tree and export a hierarchy of runnable gulp tasks, one for
// each package and phase.
createTaskTree(
    defineRoot([
        definePhase('installUtilsPhase', ACTIONS.INSTALL_PACKAGES, [
            'cowsay',
            'gpg',
            'htop',
            'jq',
            'vim',
        ]),
    ]),
    exports,
);
