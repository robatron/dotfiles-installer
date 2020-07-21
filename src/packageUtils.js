const commandExistsSync = require('command-exists').sync;
const { exec } = require('shelljs');
const {
    PLATFORM: { IS_LINUX, IS_MAC },
} = require('./constants');
const Phase = require('./Phase');
const Package = require('./Package');

// Create a new package object from a definition
const createPackage = (pkg, action) => {
    if (typeof pkg === 'string') {
        return new Package(pkg, { action });
    } else if (Array.isArray(pkg)) {
        const pkgName = pkg[0];
        const pkgOpts = pkg[1];
        return new Package(pkgName, { ...pkgOpts, action });
    } else {
        throw new Error(`Malformed package definition: ${JSON.stringify(pkg)}`);
    }
};

// Install the specified package
const installPackage = (pkg) => {
    const installCommands = pkg.actionArgs.installCommands;
    const cmds = [];

    // Pick commands to run for the installation of this package
    if (installCommands) {
        installCommands.forEach((cmd) => cmds.push(cmd));
    } else if (IS_MAC) {
        cmds.push(`brew install ${pkg.name}`);
    } else if (IS_LINUX) {
        cmds.push(`sudo apt install -y ${pkg.name}`);
    } else {
        throw new Error(
            `Cannot determine install command(s) for package '${pkg.name}'`,
        );
    }

    // Run install commands
    cmds.forEach((cmd) => {
        if (exec(cmd).code) {
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
    createPackage,
    installPackage,
    isPackageInstalled,
};
