# akinizer

Akinizer is a [configuration management](https://en.wikipedia.org/wiki/Configuration_management) utility I use to install my preferred programs and personal dotfiles on a new system, a la [chef](https://www.chef.io/), [puppet](https://puppet.com/), [salt](https://www.saltstack.com/), etc. I created it as a programming exercise for fun, learning, and practice.

## Supported systems

-   Mac OS X
-   Ubuntu

## Quickstart

Git is required to install, bootstrap, and run akinizer. On Ubuntu, you can install it via `apt`:

    sudo apt update && sudo apt install git -y

On Mac OS X, you can install it via [Homebrew](https://brew.sh/):

    brew install git

Once git is installed, just download, bootstrap, and run akinizer:

    # 1. Download akinizer to ~/opt
    mkdir -p ~/opt && \
    git clone \
        git@github.com:robatron/akinizer.git \
        ~/opt/akinizer && \

    # 2. Bootstrap required system dependencies
    cd ~/opt/akinizer && \
    . ~/bootstrap.sh && \

    # 3. Start the installer
    gulp

## Usage

Akinizer uses [gulp](https://gulpjs.com/) to define, manage, and run tasks. To define your own system configuration, create a gulpfile, and import akinizer. See the [./gulpfile.js][] for an example.

System configuration is defined as phases organized in a task tree. Each phase has a list of packages and an action to apply to them. Actions support different arguments. Here's an example:

```js
const path = require('path');
const {
    ACTIONS,
    createTaskTree,
    definePhase,
    defineRoot,
    fileExists,
} = require('akinizer');

// Create the full gulp task tree from the phase and pakage definitions, then
// export them as gulp tasks
createTaskTree(
    // Define the task tree root consisting of phases
    defineRoot([
        // Define phases. In this phase, we're verifying packages are installed.
        definePhase(
            'verifyPrereqsPhase',

            // For every package, apply the `VERIFY` action
            ACTIONS.VERIFY,

            // List packages to be verified
            [
                'curl',
                'git',
                'node',
                'npm',

                // Packages can control the behavior of the actions with action
                // arguments. In this case, we're defining a `testFn` that the
                // `VERIFY` action will use to verify this package is installed
                [
                    'nvm',
                    {
                        testFn: (pkg) =>
                            fileExists(
                                path.join(
                                    process.env['NVM_DIR'] ||
                                        path.join(
                                            process.env['HOME'],
                                            `.${pkg.name}`,
                                        ),
                                    `${pkg.name}.sh`,
                                ),
                            ),
                    },
                ],
            ],

            // We can tell the phase to run its verifications in parallel
            { parallel: true },
        ),
    ]),

    // Pass in `exports` so gulp tasks can be added
    exports,
);
```

## Actions

Supported actions.

### Install

Installs a package.

#### Supported arguments

-   `gitPackage` - Marks this package as a "git package"
    -   `repoUrl` - Marks the package to be installed via git. Should be the http url to the git repo of the package.
    -   `symlink` (optional) - File to symlink from the repo after its cloned
    -   `binDir` (optional) - Symlink target directory
    -   `cloneDir` (optional) - Clone target directory
-   `installCommands` - Use these install commands instead of the system default.
-   `postInstall` - Commands to run after installation
-   `testFn` - Alternative function used to test a package is installed. Return `true` for "installed", and `false` if not. Called with the current package.

### Verify

Verifies packages are installed.

#### Supported arguments

-   `testFn` - Alternative function used to test a package is installed. Return `true` for "installed", and `false` if not. Called with the current package.
