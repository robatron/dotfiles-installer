const { ACTIONS } = require('./constants');
const { execJob } = require('./execUtils');
const log = require('./log');
const {
    isPackageInstalled,
    installPackageViaGit,
    installPackage,
} = require('./packageUtils');

// Handlers for supported actions
const actionHandlers = {
    [ACTIONS.EXECUTE_JOBS]: (target) => {
        log.info(`Executing job for '${target.name}'...`);
        execJob(target);
    },

    [ACTIONS.INSTALL_PACKAGES]: (target) => {
        const {
            actionArgs: { forceAction, gitPackage },
            name,
        } = target;
        const installFn = gitPackage ? installPackageViaGit : installPackage;

        if (forceAction && forceAction(target)) {
            log.info(`Forcing install of '${name}'...`);

            installFn(target);
        } else {
            log.info(`Checking if target package '${name}' is installed...`);

            if (!isPackageInstalled(target)) {
                log.info(
                    `Target package '${name}' is not installed. Proceeding with installation...`,
                );
                installFn(target);
            } else {
                log.info(
                    `Target package '${name}' is already installed. Moving on...`,
                );
            }
        }
    },

    [ACTIONS.VERIFY_PACKAGES]: (target) => {
        log.info(`Verifying target package ${target.name} is installed...`);
        if (!isPackageInstalled(target)) {
            throw new Error(
                `Target package '${target.name}' is not installed!`,
            );
        } else {
            log.info(
                `Target package '${target.name}' is installed. Moving on...`,
            );
        }
    },
};

module.exports = actionHandlers;
