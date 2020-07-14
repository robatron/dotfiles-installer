const { task } = require('gulp');
const { installPackage, isPackageInstalled } = require('./assureInstalled');

const createVerifyTasks = (pkgs) => {
    const generatedTaskNames = [];

    pkgs.forEach((pkg) => {
        const taskName = `verifyInstalled:${pkg.name}`;

        task(taskName, (cb) => {
            log.info(`Verifying '${pkg.name}' is installed...`);

            if (!isPackageInstalled(pkg, pkg.meta.testFn)) {
                throw new Error(
                    `Package '${pkg.name}' is not installed! (Have you run bootstrap.sh?)`,
                );
            }

            cb();
        });

        generatedTaskNames.push(taskName);
    });

    return generatedTaskNames;
};

module.exports = {
    createVerifyTasks,
};
