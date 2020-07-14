const Package = class {
    constructor(name, meta = {}) {
        this.name = name;
        this.meta = meta;
    }
};

module.exports = Package;
