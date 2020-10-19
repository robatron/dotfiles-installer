# Akinizer

Akinizer is a [configuration management](https://en.wikipedia.org/wiki/Configuration_management) tool I created to install my preferred programs and personal configs on a new system.

## Why not use [chef](https://www.chef.io/), [puppet](https://puppet.com/), [salt](https://www.saltstack.com/), etc.?

Why use robust, high-quality, battle-tested software when I could write my own janky version in JavaScript? 😉 But seriously, I created this project for the fun and challenge.

## Supported systems

Akinizer currently supports the following operating systems. (But it would probably work on other versions of macOS and Debian-based Linux distros.)

-   macOS 10.15, 11.0
-   Ubuntu 18.04, 20.04

End-to-end tests are run on the OSs defined in the [strategy.matrix.os](https://docs.github.com/en/free-pro-team@latest/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstrategymatrix) list in the [.github/workflows/test-bootstrap-apply-master.yml](.github/workflows/test-bootstrap-apply-master.yml) file.

## Quickstart

To install Akinizer, run the following command:

    curl -o- https://raw.githubusercontent.com/robatron/akinizer/master/bootstrap.sh | bash

This runs a bootstrapping script which prepares the system for Akinizer by:

1. Installing required system programs, e.g., `git`, `node`, `nvm`, and `gulp`
2. Downloads Akinizer itself
3. Installs Akinizer's dependencies

See the [bootstrap.sh](bootstrap.sh) script for more details.

## Usage

Akinizer uses [gulp](https://gulpjs.com/) to define, manage, and run tasks. To define your own system configuration, create a gulpfile, import akinizer, and define your configuration. **See [example/gulpfile.js](example/gulpfile.js) for an annotated working example.**

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

-   [GitHub Actions](https://docs.github.com/en/free-pro-team@latest/actions)
-   [Jest](https://jestjs.io/)'s `.toMatchInlineSnapshot`, `.toThrowErrorMatchingInlineSnapshot`
-   [Declarative programming](https://en.wikipedia.org/wiki/Declarative_programming)

# License

[MIT](./LICENSE)
