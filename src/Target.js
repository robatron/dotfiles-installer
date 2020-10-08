const Target = class {
    constructor(name, targetOpts = {}) {
        // Validate required params
        if (!name) {
            throw new Error('A target name is required');
        }

        // Name of this target
        this.name = name;

        // Action to be performed on this target
        this.action = targetOpts.action;

        // Other arguments supported and/or required for the action not
        // explicitly extracted as a Target property
        this.actionArgs = targetOpts.actionArgs || targetOpts;

        // System command, defaulting to the target name
        this.command = targetOpts.command || this.name;
    }
};

// Create a new target object from a definition
const createTargetFromDef = (targetDef, action, inheritedTargetOpts) => {
    if (typeof targetDef === 'string') {
        return new Target(targetDef, { ...inheritedTargetOpts, action });
    } else if (Array.isArray(targetDef)) {
        const targetName = targetDef[0];
        const targetOpts = targetDef[1] || {};
        return new Target(targetName, {
            ...inheritedTargetOpts,
            ...targetOpts,
            action,
        });
    } else {
        throw new Error(
            `Malformed target definition: ${JSON.stringify(targetDef)}`,
        );
    }
};

module.exports = { createTargetFromDef, Target };
