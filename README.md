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

Akinizer uses [gulp](https://gulpjs.com/) to define, manage, and run tasks. To define your own system configuration, create a gulpfile, import akinizer, and define your configuration. **See [./gulpfile.js](./gulpfile.js) for a working example.**

System configuration is defined as _phases_ organized in a _task tree_. Each phase has a list of targets and an _action_ to apply to them. Actions support different arguments, listed below.

## Actions

Supported actions are listed below. All actions support the following arguments:

-   **`forceAction: (undefined | function(target: Target): string)`** - (Optional) If this function is provided, always run the action if this evaluates to `true`. The `Target` will be injected
-   **`skipAction: (undefined | function(target: Target): string)`** - (Optional) If this function is provided, always skip the action if this evaluates to `true`. The `Target` will be injected
-   **`skipActionMessage: function(target: Target): string`** - (Optional) A function that return a message to explain why the action was skipped. The `Target` will be injected

### Execute

Executes arbitrary shell code. Additional supported arguments:

-   **`actionCommands: string[]`** - Shell commands to execute.

### Install

Installs a target package. Additional supported arguments:

-   **`actionCommands: string[]`** - Shell commands to execute
-   **`gitPackage: object`** - Marks this target as a "git package"
    -   **`gitPackage.repoUrl: string`** - URL (HTTP) to the git repo of the target package
    -   **`gitPackage.symlink: string`** - (Optional) File to symlink from the repo after its cloned
    -   **`gitPackage.binDir: string`** - (Optional) Symlink target directory
    -   **`gitPackage.cloneDir: string`** - (Optional) Clone target directory
-   **`postInstall: function(target: Target): void`** - (Optional) Function that's called with the `target` after installation is complete

### Verify

Verifies packages are installed. There are no additional supported arguments.

# Learnings

Skills and technologies learned / practiced while creating this project:

-   GitHub Actions
-   Jest `.toMatchInlineSnapshot`, `.toThrowErrorMatchingInlineSnapshot`

# License

[MIT](./LICENSE)
