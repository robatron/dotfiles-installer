# Akinizer

Akinizer is an [OS config management](https://en.wikipedia.org/wiki/Configuration_management#Operating_System_configuration_management) tool for installing programs and configs, regardless of operating system.

## Why not use [Puppet](https://puppet.com/), [Chef](https://www.chef.io/), [Ansible](https://www.ansible.com/), [SaltStack](https://www.saltstack.com/), etc.?

I created Akinizer for fun, practice, and to learn about [operating system configuration management](https://en.wikipedia.org/wiki/Configuration_management#Operating_System_configuration_management). Why use robust, high-quality, battle-tested software when I could write my own janky version in JavaScript? 😉

## Supported systems

Akinizer currently supports the following operating systems. (But it would probably work on other versions of macOS and Debian-based Linux distros.)

-   macOS 10.15, 11.0
-   Ubuntu 18.04, 20.04

End-to-end tests are run against these systems which are defined in the [strategy.matrix.os](https://docs.github.com/en/free-pro-team@latest/actions/reference/workflow-syntax-for-github-actions#jobsjob_idstrategymatrix) list in [.github/workflows/test-bootstrap-apply-master.yml](.github/workflows/test-bootstrap-apply-master.yml).

## Quickstart

To install Akinizer, run the following command:

    curl -o- https://raw.githubusercontent.com/robatron/akinizer/master/bootstrap.sh | bash

This runs a bootstrapping script which prepares the system for Akinizer by:

1. Installing required system programs, e.g., `git`, `node`, `nvm`, and `gulp`
2. Downloads Akinizer itself
3. Installs Akinizer's dependencies

See the [bootstrap.sh](bootstrap.sh) script for more details.

## Usage

Akinizer's system configuration is declared as a tree of **phases**, each of which contains a list of **targets** and an **action** to apply to them. Akinizer converts this phase tree into a hierarchy of runnable [gulp](https://gulpjs.com/) tasks. Here's a simple example. (For a full example, see "Working example" below.)

```js
const {
    ACTIONS,
    createTaskTree,
    definePhase,
    defineRoot,
} = require('akinizer');

// Create task tree from phase and package definitions and export them as
// runnable gulp tasks
createTaskTree(
    defineRoot([
        definePhase('installUtilsPhase', ACTIONS.INSTALL_PACKAGES, [
            'cowsay',
            'gpg',
            'htop',
            'jq',
            'vim',
        ]),
    ]),
    exports,
);
```

### Working example

For a full, working, annotated example, see [./example/gulpfile.js]().

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

Here are a few noteable technologies and concepts I learned, and/or practiced to create this project.

-   [GitHub Actions](https://github.com/features/actions) is used as the CI/CD pipeline technology to run end-to-end and unit tests against a matrix of operating systems and scenarios.
    -   It supports Ubuntu and macOS, Akinizer's target operating systems
    -   It's free within [generous limits](https://docs.github.com/en/free-pro-team@latest/actions/reference/usage-limits-billing-and-administration#usage-limits)!
    -   See the `*.yml` files in [.github/workflows/]()
-   [Docker](https://www.docker.com/) is used as a local development sandbox, ideal for testing configuration management stuff!
    -   See [Dockerfile]() for details
-   [Jest snapshot testing](https://jestjs.io/docs/en/snapshot-testing) is used to quickly test complex task trees and other objects outside of a [React](https://reactjs.org/)/UI testing context.
    -   [Inline snapshots](https://jestjs.io/docs/en/snapshot-testing#inline-snapshots) are used to test smaller objects alongside `expect` statements
    -   [`.toThrowErrorMatchingInlineSnapshots`](https://jestjs.io/docs/en/expect#tothrowerrormatchinginlinesnapshotinlinesnapshot) is used to easily test error messages
-   Semi-[declarative programming](https://en.wikipedia.org/wiki/Declarative_programming) pattern is used to define task and phase trees.
    -   See [example/gulpfile.js]() for an example.
-   The [simple-git](https://github.com/steveukx/git-js#readme) library is used for interacting with git repos
    -   The [nodegit](https://www.nodegit.org/) library is powerful, but turned out to be too low-level and complex for this project
-   [Node-config](https://github.com/lorenwest/node-config) is used to enable Akinizer configuration via config files. See [example/.akinizerrc.js]() for an example.
-   The [Connonical way](https://prettier.io/docs/en/integrating-with-linters.html) to combine [Prettier](https://prettier.io/) and [Eslint](https://eslint.org/) is used to enable seamless linting and formatting

# License

[MIT](./LICENSE)
