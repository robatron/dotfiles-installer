const actionHandlers = require('../actionHandlers');
const { ACTIONS } = require('../constants');
const { execJob } = require('../execUtils');
const log = require('../log');
const {
    isPackageInstalled,
    installPackageViaGit,
    installPackage,
} = require('../packageUtils');
const { Target } = require('../Target');

jest.mock('../execUtils');
jest.mock('../log');
jest.mock('../packageUtils');

describe('actionHandlers', () => {
    const defaultTarget = new Target('target');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('EXECUTE_JOBS', () => {
        it('executes the target job', () => {
            actionHandlers[ACTIONS.EXECUTE_JOBS](defaultTarget);

            expect(execJob).toBeCalledWith(defaultTarget);
            expect(log.info.mock.calls).toMatchInlineSnapshot(`
                Array [
                  Array [
                    "Executing job for 'target'...",
                  ],
                ]
            `);
        });
    });

    describe('INSTALL_PACKAGES', () => {
        const action = actionHandlers[ACTIONS.INSTALL_PACKAGES];

        it('force installs the target package', () => {
            const target = new Target('target', {
                forceAction: () => true,
            });

            action(target);

            expect(installPackage).toBeCalledWith(target);
            expect(log.info.mock.calls).toMatchInlineSnapshot(`
                Array [
                  Array [
                    "Forcing install of 'target'...",
                  ],
                ]
            `);
        });

        it('force installs the target git package', () => {
            const target = new Target('target', {
                forceAction: () => true,
                gitPackage: {},
            });

            action(target);

            expect(installPackageViaGit).toBeCalledWith(target);
        });

        it("skips target package installation if it's already installed", () => {
            isPackageInstalled.mockImplementationOnce(() => true);

            action(defaultTarget);

            expect(installPackage).not.toBeCalled();
            expect(log.info.mock.calls).toMatchInlineSnapshot(`
                Array [
                  Array [
                    "Checking if target package 'target' is installed...",
                  ],
                  Array [
                    "Target package 'target' is already installed. Moving on...",
                  ],
                ]
            `);
        });

        it("installs the package if it's not already", () => {
            isPackageInstalled.mockImplementationOnce(() => false);

            action(defaultTarget);

            expect(installPackage).toBeCalledWith(defaultTarget);
            expect(log.info.mock.calls).toMatchInlineSnapshot(`
                Array [
                  Array [
                    "Checking if target package 'target' is installed...",
                  ],
                  Array [
                    "Target package 'target' is not installed. Proceeding with installation...",
                  ],
                ]
            `);
        });
    });

    describe('VERIFY_PACKAGES', () => {
        const action = actionHandlers[ACTIONS.VERIFY_PACKAGES];

        it('verifies a target package is installed', () => {
            isPackageInstalled.mockImplementationOnce(() => true);

            action(defaultTarget);

            expect(log.info.mock.calls).toMatchInlineSnapshot(`
                Array [
                  Array [
                    "Verifying target package target is installed...",
                  ],
                  Array [
                    "Target package 'target' is installed. Moving on...",
                  ],
                ]
            `);
        });

        it('throws if target package is not installed', () => {
            isPackageInstalled.mockImplementationOnce(() => false);

            expect(() => {
                action(defaultTarget);
            }).toThrowErrorMatchingInlineSnapshot(
                `"Target package 'target' is not installed!"`,
            );
            expect(log.info.mock.calls).toMatchInlineSnapshot(`
                Array [
                  Array [
                    "Verifying target package target is installed...",
                  ],
                ]
            `);
        });
    });
});
