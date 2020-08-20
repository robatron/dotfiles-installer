const commandExistsSync = require('command-exists').sync;
const shell = require('shelljs');
const platform = require('./platformUtils');

// Install the specified package
const installPackage = (pkg) => {
    const installCommands = pkg.actionArgs.installCommands;
    const cmds = [];

    // Pick commands to run for the installation of this package
    if (installCommands) {
        installCommands.forEach((cmd) => cmds.push(cmd));
    } else if (platform.isLinux()) {
        cmds.push(`sudo apt install -y ${pkg.name}`);
    } else if (platform.isMac()) {
        cmds.push(`brew install ${pkg.name}`);
    } else {
        throw new Error(
            `Cannot determine install command(s) for package '${pkg.name}'`,
        );
    }

    // Run install commands
    cmds.forEach((cmd) => {
        const returnCode = shell.exec(cmd).code;
        if (returnCode !== 0) {
            const fullCommandMessage =
                cmds.length > 1
                    ? ` Full command set: ${JSON.stringify(cmds)}`
                    : '';
            throw new Error(
                `Install command '${cmd}' failed for package '${pkg.name}'.${fullCommandMessage}`,
            );
        }
    });
};

// Return if a package is installed or not
const isPackageInstalled = (pkg) => {
    const testFn = pkg.actionArgs.testFn;

    return testFn
        ? (() => {
              log.info(
                  `Using custom test to verify '${pkg.name}' is installed...`,
              );
              const result = testFn(pkg);
              if (!result) {
                  log.info(
                      `Custom test for '${pkg.name}' failed. Assuming not installed...`,
                  );
              }
              return result;
          })()
        : commandExistsSync(pkg.command);
};

module.exports = {
    installPackage,
    isPackageInstalled,
};
