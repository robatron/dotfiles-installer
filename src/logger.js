const { createLogger, format, transports } = require('winston');

// Create a global logger for all modules
const createGlobalLogger = () => {
    global.log =
        global.log ||
        createLogger({
            transports: [
                new transports.Console({
                    format: format.combine(format.colorize(), format.simple()),
                }),
            ],
        });
};

module.exports = { createGlobalLogger };
