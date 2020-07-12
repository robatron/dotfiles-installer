const commandExistsSync = require('command-exists').sync;

// Execute a command, exiting on error
const execCmd = (command) => {
    log.info(`Executing "${command}..."`);
    if (exec(command).code !== 0) {
        log.error(`Execution of "${command} failed!"`);
        exit(1);
    }
};

// Verify a package is installed, install a package if it is not installed
const assureInstalled = (
    packageName,
    // Optional
    {
        commandName, // Command name, if different from package name
        installCommands, // Commands to exec, otherwise use system package manager
        shouldInstall, // Condition that must evaluate `true` to continue
    } = {},
) => {
    log.info(`Verifying package "${packageName}" is installed...`);
    if (
        typeof shouldInstall !== 'undefined'
            ? shouldInstall
            : !commandExistsSync(commandName || packageName)
    ) {
        log.info(`Package "${packageName}" not installed. Installing...`);

        if (installCommands) {
            installCommands.forEach((command) => execCmd(command));
        } else if (IS_MAC) {
            execCmd(`brew install ${packageName}`);
        } else if (IS_LINUX) {
            execCmd(`sudo apt install -y ${packageName}`);
        } else {
            log.error('Unsupported system. Aborting.');
            exit(1);
        }

        log.info(`Package "${packageName}" successfully installed!`);
    }
};

const verifyInstalled = (packageName) => commandExistsSync(packageName);

module.exports = { assureInstalled, verifyInstalled };
