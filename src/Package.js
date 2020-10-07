const Package = class {
    constructor(name, pkgOpts = {}) {
        // Validate required params
        if (!name) {
            throw new Error('A package name is required');
        }

        // Name of this package
        this.name = name;

        // Target action to be performed on this package
        this.action = pkgOpts.action;

        // Other arguments supported and/or required for the action not
        // explicitly extracted as a Package property
        this.actionArgs = pkgOpts.actionArgs || pkgOpts;

        // System command, defaulting to the package name
        this.command = pkgOpts.command || this.name;

        // Force the action
        this.forceAction = pkgOpts.forceAction || false;

        // Skip the action
        this.skipAction = pkgOpts.skipAction || false;
    }
};

// Create a new package object from a definition
const createPackageFromDef = (pkgDef, action, inheritedPkgOpts) => {
    if (typeof pkgDef === 'string') {
        return new Package(pkgDef, { ...inheritedPkgOpts, action });
    } else if (Array.isArray(pkgDef)) {
        const pkgName = pkgDef[0];
        const pkgOpts = pkgDef[1] || {};
        return new Package(pkgName, {
            ...inheritedPkgOpts,
            ...pkgOpts,
            action,
        });
    } else {
        throw new Error(
            `Malformed package definition: ${JSON.stringify(pkgDef)}`,
        );
    }
};

module.exports = { createPackageFromDef, Package };
