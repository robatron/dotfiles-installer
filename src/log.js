const { createLogger, format, transports } = require('winston');

const log = createLogger({
    transports: [
        new transports.Console({
            format: format.combine(format.colorize(), format.simple()),
        }),
    ],
});

module.exports = log;
