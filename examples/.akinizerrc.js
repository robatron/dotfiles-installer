const os = require('os');
const path = require('path');

// Example Akinizer configuration (with default values)
module.exports = {
    // Directory in which to install user-space binaries
    binInstallDir: path.join(os.homedir(), 'bin'),

    // Directory in which to install user-space git packages
    gitCloneDir: path.join(os.homedir(), 'opt'),
};
