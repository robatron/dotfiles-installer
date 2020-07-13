const commandExistsSync = require('command-exists').sync;
const { exec } = require('shelljs');

// Install the specified package. Returns any encountered errors.
const installPackage = (pkg) => {
    const installCommands = [];

    // Pick install commands
    if (pkg.meta.installCommands) {
        installCommands.concat(pkg.meta.installCommands);
    } else if (IS_MAC) {
        installCommands.push(`brew install ${pkg.name}`);
    } else if (IS_LINUX) {
        installCommands.push(`sudo apt install -y ${pkg.name}`);
    } else {
        return `Cannot determine install command(s) for package '${pkg.name}'`;
    }

    // Run install commands
    installCommands.forEach((cmd) => {
        const returnCode = exec(cmd).code;
        if (!returnCode) {
            const fullCommandMessage =
                installCommands.length > 1
                    ? ` Full command set: ${JSON.stringify(installCommands)}`
                    : '';
            return `Install command '${cmd}' failed for package '${pkg.name}'.${fullCommandMessage}`;
        }
    });

    // Return without error
    return null;
};

// Return if a package is installed
const isPackageInstalled = (pkg, testFn) => {
    return testFn
        ? testFn(pkg)
        : commandExistsSync(pkg.meta.command || pkg.name);
};

module.exports = { installPackage, isPackageInstalled };
