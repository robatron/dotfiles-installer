const commandExistsSync = require('command-exists').sync;
const { series } = require('gulp');
const { exec, exit } = require('shelljs');
const { createLogger, format, transports } = require('winston');

const IS_MAC = process.platform === 'darwin';
const IS_LINUX = process.platform === 'linux';

const log = createLogger({
    transports: [
        new transports.Console({
            format: format.combine(format.colorize(), format.simple()),
        }),
    ],
});

// Helpers --------------------------------------------------------------------

// Execute a command, exiting on error
const execCmd = command => {
    log.info(`Executing "${command}..."`);
    if (exec(command).code !== 0) {
        log.error(`Execution of "${command} failed!"`);
        exit(1);
    }
};

// Verify a package is installed, install a package if it is not installed
const assureInstalled = (
    packageName,
    // Optional
    {
        commandName, // Command name, if different from package name
        installCommands, // Commands to exec, otherwise use system package manager
        shouldInstall, // Condition that must evaluate `true` to continue
    } = {},
) => {
    log.info(`Verifying package "${packageName}" is installed...`);
    if (
        typeof shouldInstall !== 'undefined'
            ? shouldInstall
            : !commandExistsSync(commandName || packageName)
    ) {
        log.info(`Package "${packageName}" not installed. Installing...`);

        if (installCommands) {
            installCommands.forEach(command => execCmd(command));
        } else if (IS_MAC) {
            execCmd(`brew install ${packageName}`);
        } else if (IS_LINUX) {
            execCmd(`sudo apt install -y ${packageName}`);
        } else {
            log.error('Unsupported system. Aborting.');
            exit(1);
        }

        log.info(`Package "${packageName}" successfully installed!`);
    }
};

// Tasks ----------------------------------------------------------------------

const assureSystemPackageManager = cb => {
    log.info('Assuring system package manager is available...');

    // Mac OS X
    if (IS_MAC) {
        log.info('Mac OS X detected.');

        const brewInstallScriptUrl =
            'https://raw.githubusercontent.com/Homebrew/install/master/install';
        assureInstalled('brew', {
            installCommands: [
                `/usr/bin/ruby -e "$(curl -fsSL ${brewInstallScriptUrl})"`,
            ],
        });
    } else if (IS_LINUX) {
        log.info('Linux detected.');

        if (!commandExistsSync('apt')) {
            log.error(
                'No supported system package managers available. Aborting.',
            );
            exit(1);
        }
    } else {
        log.error('Unsupported system. Aborting.');
        exit(1);
    }

    cb();
};

function installBasePrograms(cb) {
    log.info('Installing base programs...');

    assureInstalled('git');

    assureInstalled('python3');

    IS_LINUX && assureInstalled('python3-distutils', { shouldInstall: true });

    assureInstalled('pip', {
        installCommands: [
            'sudo curl https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py',
            'sudo -H python3 /tmp/get-pip.py',
        ],
    });

    // Required by yadm
    assureInstalled('envtpl', {
        installCommands: ['sudo -H pip install envtpl'],
    });

    cb();
}

exports.installRequiredPrograms = series(
    assureSystemPackageManager,
    installBasePrograms,
);

exports.default = exports.installRequiredPrograms;
