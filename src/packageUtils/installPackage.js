const { execCommands } = require('../execUtils');
const log = require('../log');
const { isLinux, isMac } = require('../platformUtils');

// Install the specified target
const installPackage = async (target) => {
    const { actionCommands, isGUI, postInstall } = target.actionArgs;
    const cmds = [];

    log.info(`Installing target '${target.name}'...`);

    // Use explicit install commands if specified
    if (actionCommands) {
        actionCommands.forEach((cmd) => cmds.push(cmd));
    }

    // Install via the system target managers
    else if (isLinux()) {
        cmds.push(`sudo apt install -y ${target.name}`);
    } else if (isMac()) {
        if (isGUI) {
            cmds.push(`brew install --cask ${target.name}`);
        } else {
            cmds.push(`brew install ${target.name}`);
        }
    }

    // Error if we don't know how to install this target
    else {
        throw new Error(
            `Cannot determine install command(s) for target '${target.name}'`,
        );
    }

    // Run install commands
    execCommands(cmds);

    // Run any post install steps
    if (postInstall) {
        log.info(`Running post-install scripts for ${target.name}...`);
        postInstall(target);
    }
};

module.exports = installPackage;
