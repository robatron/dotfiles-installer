const { createLogger, format, transports } = require('winston');

// Create a global logger for all to use if one doesn't exist
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
