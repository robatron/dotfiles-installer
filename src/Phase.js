const { ACTIONS } = require('./constants');

// Phase is a class that represents a set of actions to be executed.
const Phase = class {
    constructor(name, phaseOpts = {}) {
        // Name of this phase
        this.name = name || 'namelessPhase';

        // Action to perform on each package, defaulting to VERIFY
        this.action = phaseOpts.action || ACTIONS.VERIFY;

        // Run the packages in parallel? Default to serial
        this.parallel = phaseOpts.parallel || false;

        // Targets which to apply the action
        this.targets = phaseOpts.targets;
    }
};

module.exports = Phase;
