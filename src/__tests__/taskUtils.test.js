const gulp = require('gulp');
const taskUtils = require('../taskUtils');
const { Package } = require('../Package');
const packageUtils = require('../packageUtils');
const { ACTIONS } = require('../constants');
const { definePhase } = require('../phaseUtils');

jest.mock('../packageUtils');
jest.mock('gulp');

const defaultTestPackage = new Package('packageName', {
    action: 'action',
});

describe('createPackageTask', () => {
    it('returns and exports a task function, and sets the display name', () => {
        const testExports = {};
        const expectedTaskName = 'phase:action:packageName';

        const resultTask = taskUtils.createPackageTask(
            defaultTestPackage,
            testExports,
            'phase',
        );

        expect(resultTask.displayName).toBe(expectedTaskName);
        expect(typeof testExports[expectedTaskName]).toBe('function');
        expect(testExports[expectedTaskName]).toBe(resultTask);
    });

    describe('the test task itself', () => {
        const mockCb = jest.fn(() => 'cbReturn');
        const logWarnMock = jest.fn();
        const logInfoMock = jest.fn();

        global.log = {
            info: logInfoMock,
            warn: logWarnMock,
        };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('skips the action if specified', () => {
            const testPackage = new Package('packageName', {
                skipAction: true,
            });
            const taskFn = taskUtils.createPackageTask(testPackage, {});

            const taskResult = taskFn(mockCb);

            expect(logWarnMock).toBeCalledWith("Skipping 'packageName'...");
            expect(mockCb).toBeCalledTimes(1);
            expect(taskResult).toEqual('cbReturn');
        });

        it('always verifies the package is installed and returns the callback', () => {
            packageUtils.isPackageInstalled.mockReturnValue(true);

            const taskFn = taskUtils.createPackageTask(defaultTestPackage, {});
            const taskResult = taskFn(mockCb);

            expect(logInfoMock).toBeCalledWith(
                "Verifying 'packageName' is installed...",
            );
            expect(packageUtils.isPackageInstalled).toBeCalledWith(
                defaultTestPackage,
            );
            expect(mockCb).toBeCalledTimes(1);
            expect(taskResult).toEqual('cbReturn');
        });

        it('installs the package if install action specified', () => {
            packageUtils.isPackageInstalled.mockReturnValue(false);

            const testPackage = new Package('packageName', {
                action: ACTIONS.INSTALL,
            });
            const taskFn = taskUtils.createPackageTask(testPackage, {});
            const taskResult = taskFn(mockCb);

            expect(logInfoMock).toBeCalledWith(
                "Package 'packageName' is not installed",
            );
            expect(logInfoMock).toBeCalledWith(
                "Installing package 'packageName'...",
            );
            expect(packageUtils.installPackage).toBeCalledWith(testPackage);
            expect(mockCb).toBeCalledTimes(1);
            expect(taskResult).toEqual('cbReturn');
        });

        it('throws if the package is not installed and verify action specified', () => {
            packageUtils.isPackageInstalled.mockReturnValue(false);

            const testPackage = new Package('packageName', {
                action: ACTIONS.VERIFY,
            });
            const taskFn = taskUtils.createPackageTask(testPackage, {});

            expect(() => {
                taskFn(mockCb);
            }).toThrow(
                "Package 'packageName' is not installed! (Have you run bootstrap.sh?)",
            );
        });

        it('throws if the package action is not supported', () => {
            packageUtils.isPackageInstalled.mockReturnValue(false);

            const testPackage = new Package('packageName', {
                action: 'unsupportedAction',
            });
            const taskFn = taskUtils.createPackageTask(testPackage, {});

            expect(() => {
                taskFn(mockCb);
            }).toThrow(
                "Action 'unsupportedAction' for package 'packageName' is not supported.",
            );
        });
    });
});

describe('createPhaseTask', () => {
    const defaultPhaseName = 'testPhaseName';
    const defaultPkgs = ['target-a', 'target-b', 'target-c'];

    beforeEach(() => {
        jest.clearAllMocks();

        ['parallel', 'series'].forEach((asyncType) => {
            gulp[asyncType] = jest.fn((tasks) => {
                return {
                    asyncType,
                    displayName: null,
                    tasks: tasks.map((task) =>
                        typeof task === 'function' ? 'task-fn' : task,
                    ),
                };
            });
        });
    });

    ['INSTALL', 'VERIFY'].forEach((action) => {
        it(`creates tasks for ${action} action`, () => {
            const phaseDef = definePhase(
                defaultPhaseName,
                ACTIONS[action],
                defaultPkgs,
            );

            const testExports = {};
            taskUtils.createPhaseTask(phaseDef, testExports);
            expect(testExports).toMatchSnapshot();
        });
    });

    it(`creates tasks for RUN_PHASES action`, () => {
        const phaseDef = definePhase(defaultPhaseName, ACTIONS.RUN_PHASES, [
            definePhase(defaultPhaseName, ACTIONS.INSTALL, defaultPkgs),
            definePhase(defaultPhaseName, ACTIONS.VERIFY, defaultPkgs),
        ]);

        const testExports = {};
        taskUtils.createPhaseTask(phaseDef, testExports);
        expect(testExports).toMatchSnapshot();
    });
});
