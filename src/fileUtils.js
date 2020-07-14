const { accessSync } = require('fs');

// Syncronously return if a file at the specified
// path exists
const fileExists = (path) => {
    try {
        accessSync(path);
    } catch (err) {
        return false;
    }
    return true;
};

module.exports = { fileExists };
