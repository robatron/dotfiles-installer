const commandExistsSync = require('command-exists').sync;
const { series } = require('gulp');
const { assureInstalled } = require('./src/assureInstalled');
const { createGlobalLogger } = require('./src/logger');
const { IS_LINUX, IS_MAC } = require('./src/platform');

// Init
createGlobalLogger();

// Tasks
const assureSystemPackageManager = (cb) => {
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

    IS_LINUX && assureInstalled('python3-distutils');

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
