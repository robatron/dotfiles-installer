const {
    ACTIONS,
    createTaskTree,
    definePhase,
    defineRoot,
} = require('akinizer');

// Create task tree from phase and package definitions and export them as
// runnable gulp tasks
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
