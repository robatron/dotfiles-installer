const Package = class {
    constructor(name, meta = {}) {
        this.meta = meta;
        this.name = name;
    }
};

module.exports = Package;
