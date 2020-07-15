// A "phase" defines actions to be performed on a set of packages
const Phase = class {
    constructor(name, phaseOpts = {}) {
        if (!(name && typeof name === 'string')) {
            throw new Error('Phase `name` must be a non-empty string');
        }

        // Name of this phase (string)
        this.name = name;

        // Package definitions (array)
        this.packages = phaseOpts.packages;

        // Run the packages in serial or parallel?
        this.asyncType = phaseOpts.asyncType || 'series';

        // Action to perform on each package
        this.action = phaseOpts.action || 'verify';
    }
};

module.exports = Phase;
