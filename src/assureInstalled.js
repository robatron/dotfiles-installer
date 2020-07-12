const commandExistsSync = require('command-exists').sync;
const { exec } = require('shelljs');

// Execute a command, exiting on error
const execCmd = (command) => {
    log.info(`Executing "${command}..."`);
    if (exec(command).code !== 0) {
        log.error(`Execution of "${command} failed!"`);
        exit(1);
    }
};

// Install the specified package
const installPackage = (
    packageName,
    {
        // Commands to exec, otherwise use system package manager
        installCommands,
    } = {},
) => {
    let targetCommands;

    if (installCommands) {
        targetCommands = installCommands;
    } else if (IS_MAC) {
        targetCommands = [`brew install ${packageName}`];
    } else if (IS_LINUX) {
        targetCommands = [`sudo apt install -y ${packageName}`];
    } else {
        throw new Error('Unknown install command(s)');
    }

    installCommands.forEach((cmd) => {
        const returnCode = exec(cmd).code;
        return code === 0
            ? {
                  success: true,
                  command: cmd,
              }
            : {
                  success: false,
                  command: cmd,
                  returnCode: code,
              };
    });
};

// Return if a package is installed
const isPackageInstalled = (pkg, testFn, testFnArgs = []) =>
    testFn
        ? testFn.apply(testFnArgs)
        : commandExistsSync(pkg.meta.command || pkg.name);

module.exports = { installPackage, isPackageInstalled };
