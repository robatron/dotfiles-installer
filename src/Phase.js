// Phase is a class that represents a set of actions to be executed.
const Phase = class {
    constructor(name, phaseOpts = {}) {
        // Name of this phase
        this.name = name;

        // Package definitions (array)
        this.packages = phaseOpts.packages;

        // Run the packages in serial or parallel?
        this.asyncType = phaseOpts.asyncType || 'series';

        // Action to perform on each package, defaulting to VERIFY
        this.action = phaseOpts.action || ACTIONS.VERIFY;

        this.targets = phaseOpts.targets;
    }
};

module.exports = Phase;
