const { ACTIONS } = require('./constants');
const { execJob } = require('./execUtils');
const log = require('./log');
const installGitPackage = require('./packageUtils/installGitPackage');
const installPackage = require('./packageUtils/installPackage');
const isPackageInstalled = require('./packageUtils/isPackageInstalled');

// Handlers for supported actions
const actionHandlers = {
    [ACTIONS.EXECUTE_JOBS]: async (target) => {
        log.info(`Executing job for '${target.name}'...`);
        execJob(target);
    },

    [ACTIONS.INSTALL_PACKAGES]: async (target) => {
        const {
            actionArgs: { forceAction, gitPackage },
            name,
        } = target;
        const installFn = gitPackage ? installGitPackage : installPackage;

        if (forceAction && forceAction(target)) {
            log.info(`Forcing install of '${name}'...`);

            await installFn(target);
        } else {
            log.info(`Checking if target package '${name}' is installed...`);

            if (!isPackageInstalled(target)) {
                log.info(
                    `Target package '${name}' is not installed. Proceeding with installation...`,
                );
                await installFn(target);
            } else {
                log.info(
                    `Target package '${name}' is already installed. Moving on...`,
                );
            }
        }
    },

    [ACTIONS.VERIFY_PACKAGES]: async (target) => {
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
