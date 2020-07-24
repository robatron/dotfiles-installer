const {
    createPackageTask,
    createPhaseTask,
    createPhaseTaskTree,
} = require('../taskUtils');
const Package = require('../Package');

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
            const mockCb = jest.fn(() => 'cbReturn');
            const testPackage = new Package('packageName', {
                skipAction: true,
            });
            const taskFn = createPackageTask(testPackage, {});

            const taskResult = taskFn(mockCb);

            expect(logWarnMock).toBeCalledWith("Skipping 'packageName'...");
            expect(mockCb).toBeCalledTimes(1);
            expect(taskResult).toEqual('cbReturn');
        });
    });
});
