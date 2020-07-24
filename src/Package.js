const Package = class {
    constructor(name, pkgOpts = {}) {
        // Name of this package
        this.name = name;

        // Target action to be performed on this package
        this.action = pkgOpts.action;

        // Other arguments supported and/or required for the action not
        // explicitly extracted as a Package property
        this.actionArgs = pkgOpts.actionArgs || pkgOpts;

        // System command, defaulting to the package name
        this.command = pkgOpts.command || this.name;

        // Skip the action
        this.skipAction = pkgOpts.skipAction || false;
    }
};

module.exports = Package;
