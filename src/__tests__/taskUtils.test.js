const gulp = require('gulp');
const {
    createPackageTask,
    createPhaseTask,
    createPhaseTaskTree,
} = require('../taskUtils');
const Package = require('../Package');
const packageUtils = require('../packageUtils');
const { ACTIONS } = require('../constants');
const { createPhaseDef } = require('../phaseUtils');

jest.mock('../packageUtils');
jest.mock('gulp');

const defaultTestPackage = new Package('packageName', {
    action: 'action',
});

describe('createPackageTask', () => {
    it('returns and exports a task function, and sets the display name', () => {
        const testExports = {};
        const expectedTaskName = 'phase:action:packageName';

        const resultTask = createPackageTask(
            defaultTestPackage,
            testExports,
            'phase',
        );

        expect(resultTask.displayName).toBe(expectedTaskName);
        expect(typeof testExports[expectedTaskName]).toBe('function');
        expect(typeof resultTask).toBe('function');
        expect(testExports[expectedTaskName]).toBe(resultTask);
    });

    it('does not require a prefix', () => {
        const expectedTaskName = 'action:packageName';
        const resultTask = createPackageTask(defaultTestPackage, {});
        expect(resultTask.displayName).toBe(expectedTaskName);
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
            const taskFn = createPackageTask(testPackage, {});

            const taskResult = taskFn(mockCb);

            expect(logWarnMock).toBeCalledWith("Skipping 'packageName'...");
            expect(mockCb).toBeCalledTimes(1);
            expect(taskResult).toEqual('cbReturn');
        });

        it('always verifies the package is installed and returns the callback', () => {
            packageUtils.isPackageInstalled.mockReturnValue(true);

            const taskFn = createPackageTask(defaultTestPackage, {});
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
            const taskFn = createPackageTask(testPackage, {});
            const taskResult = taskFn(mockCb);

            expect(logInfoMock).toBeCalledWith(
                "Package 'packageName' is not installed. Installing...",
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
            const taskFn = createPackageTask(testPackage, {});

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
            const taskFn = createPackageTask(testPackage, {});

            expect(() => {
                taskFn(mockCb);
            }).toThrow(
                "Action 'unsupportedAction' for package 'packageName' is not supported.",
            );
        });
    });
});

describe('createPhaseTask', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        gulp.series.mockReturnValue('gulpSeriesReturnValue');
    });

    it('creates a single phase task for VERIFY or INSTALL actions', () => {
        const phaseDef = createPhaseDef('phaseName', ACTIONS.VERIFY, [
            'target-a',
            'target-b',
            'target-c',
        ]);
        const testExports = {};
        const actual = createPhaseTask(phaseDef, testExports);
        const expected = 'gulpSeriesReturnValue';

        expect(actual).toBe(expected);
    });
});
