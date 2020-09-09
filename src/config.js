const os = require('os');
const path = require('path');

// Config singleton initialized with default values
let config = {
    // Directory in which to install user-space binaries
    binInstallDir: path.join(os.homedir(), 'bin'),

    // Directory in which to install git packages
    gitCloneDir: path.join(os.homedir(), 'opt'),
};

// Return a copy of the current config
const getConfig = () => ({ ...config });

// Merge new config items into the config singleton. Return the new config.
const setConfig = (newConfig) => {
    config = { ...config, ...newConfig };
    return config;
};

module.exports = {
    getConfig,
    setConfig,
};
