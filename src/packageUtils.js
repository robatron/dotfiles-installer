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

// Create a new phase object from a definition
const createNewPhase = (phaseDef) => {
    if (Array.isArray(phaseDef) && phaseDef.length === 2) {
        return new Phase(phaseDef[0], phaseDef[1]);
    }
};

// Install the specified package
const installPackage = (pkg) => {
    const installCommands = [];

    // Pick commands to run for the installation of this package
    if (pkg.installCommands) {
        pkg.installCommands.forEach((cmd) => installCommands.push(cmd));
    } else if (IS_MAC) {
        installCommands.push(`brew install ${pkg.name}`);
    } else if (IS_LINUX) {
        installCommands.push(`sudo apt install -y ${pkg.name}`);
    } else {
        throw new Error(
            `Cannot determine install command(s) for package '${pkg.name}'`,
        );
    }

    // Run install commands
    installCommands.forEach((cmd) => {
        if (exec(cmd).code) {
            const fullCommandMessage =
                installCommands.length > 1
                    ? ` Full command set: ${JSON.stringify(installCommands)}`
                    : '';
            throw new Error(
                `Install command '${cmd}' failed for package '${pkg.name}'.${fullCommandMessage}`,
            );
        }
    });
};

// Return if a package is installed or not
const isPackageInstalled = (pkg, testFn) =>
    testFn
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

module.exports = {
    createPackage,
    createNewPhase,
    installPackage,
    isPackageInstalled,
};
