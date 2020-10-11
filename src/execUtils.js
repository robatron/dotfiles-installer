const { exec } = require('shelljs');
const log = require('./log');

// Stupidly execute an array of shell commands
const execCommands = (cmds, dieOnFail = true) => {
    cmds.forEach((cmd) => {
        log.info(`Executing command: ${cmd}`);

        const returnCode = exec(cmd).code;

        if (returnCode !== 0) {
            const commandSetMsg =
                cmds.length > 1
                    ? ` Full command set: ${JSON.stringify(cmds)}`
                    : '';
            const fullMsg = `Command '${cmd}' failed.${commandSetMsg}`;
            if (dieOnFail) {
                throw new Error(fullMsg);
            }
            log.warn(fullMsg);
        }
    });
};

// Treat the target like a job and execute its commands
const execJob = (target) => {
    const { actionCommands, dieOnFail } = target.actionArgs;

    if (!actionCommands) {
        throw new Error(
            `Execute failed for ${target.name}: Target option 'actionCommands' is required.`,
        );
    } else if (!Array.isArray(actionCommands)) {
        throw new Error(
            `Execute failed for ${target.name}: Option 'actionCommands' must be an array of commands to execute`,
        );
    }

    execCommands(actionCommands, dieOnFail);
};

module.exports = {
    execCommands,
    execJob,
};
