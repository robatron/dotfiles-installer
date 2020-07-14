const commandExistsSync = require('command-exists').sync;
const { exec } = require('shelljs');
const { IS_LINUX, IS_MAC } = require('./platform');

// Install the specified package. Returns any encountered errors.
const installPackage = (pkg) => {
    const installCommands = [];

    // Pick install commands
    if (pkg.meta.installCommands) {
        pkg.meta.installCommands.forEach((cmd) => installCommands.push(cmd));
    } else if (IS_MAC) {
        installCommands.push(`brew install ${pkg.name}`);
    } else if (IS_LINUX) {
        installCommands.push(`sudo apt install -y ${pkg.name}`);
    } else {
        return `Cannot determine install command(s) for package '${pkg.name}'`;
    }

    // Run install commands
    for (let i = 0; i < installCommands.length; ++i) {
        const cmd = installCommands[i];
        const returnCode = exec(cmd).code;
        if (returnCode > 0) {
            const fullCommandMessage =
                installCommands.length > 1
                    ? ` Full command set: ${JSON.stringify(installCommands)}`
                    : '';
            return `Install command '${cmd}' failed for package '${pkg.name}'.${fullCommandMessage}`;
        }
    }

    // Return without error
    return null;
};

// Return if a package is installed
const isPackageInstalled = (pkg, testFn) => {
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
        : commandExistsSync(pkg.meta.command || pkg.name);
};

module.exports = { installPackage, isPackageInstalled };
