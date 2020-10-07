const gulp = require('gulp');
const { ACTIONS } = require('../constants');
const log = require('../log');
const { Package } = require('../Package');
const packageUtils = require('../packageUtils');
const { definePhase } = require('../phaseUtils');
const taskUtils = require('../taskUtils');

jest.mock('gulp');
jest.mock('../packageUtils');
jest.mock('../log');

const defaultTestPackage = new Package('packageName', {
    action: 'action',
});

describe('createPackageFromDefTask', () => {
    it('returns and exports a task function, and sets the display name', () => {
        const testExports = {};
        const expectedTaskName = 'phase:packageName';

        const resultTask = taskUtils.createPackageFromDefTask(
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

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('skips the action if specified', () => {
            const testPackage = new Package('packageName', {
                skipAction: true,
            });
            const taskFn = taskUtils.createPackageFromDefTask(testPackage, {});

            const taskResult = taskFn(mockCb);

            expect(mockCb).toBeCalledTimes(1);
            expect(taskResult).toEqual('cbReturn');

            expect(log.warn.mock.calls).toMatchInlineSnapshot(`
                Array [
                  Array [
                    "Skipping 'packageName'...",
                  ],
                ]
            `);
        });

        it('verifies the package is installed and returns the callback', () => {
            packageUtils.isPackageInstalled.mockReturnValue(true);

            const taskFn = taskUtils.createPackageFromDefTask(
                defaultTestPackage,
                {},
            );
            const taskResult = taskFn(mockCb);

            expect(packageUtils.isPackageInstalled).toBeCalledWith(
                defaultTestPackage,
            );
            expect(mockCb).toBeCalledTimes(1);
            expect(taskResult).toEqual('cbReturn');

            expect(log.info.mock.calls).toMatchInlineSnapshot(`
                Array [
                  Array [
                    "Task ':packageName' created",
                  ],
                  Array [
                    "Verifying 'packageName'...",
                  ],
                ]
            `);
        });

        it('forces the action if specified', () => {
            const testPackage = new Package('packageName', {
                action: ACTIONS.INSTALL,
                forceAction: true,
            });
            const taskFn = taskUtils.createPackageFromDefTask(testPackage, {});
            const taskResult = taskFn(mockCb);

            expect(packageUtils.installPackage).toBeCalledWith(testPackage);
            expect(mockCb).toBeCalledTimes(1);
            expect(taskResult).toEqual('cbReturn');

            expect(log.info.mock.calls).toMatchInlineSnapshot(`
                Array [
                  Array [
                    "Task ':packageName' created",
                  ],
                  Array [
                    "Verifying 'packageName'...",
                  ],
                  Array [
                    "Forcing action 'install' for 'packageName'...'",
                  ],
                ]
            `);
        });

        it('installs the package if install action specified', () => {
            packageUtils.isPackageInstalled.mockReturnValue(false);

            const testPackage = new Package('packageName', {
                action: ACTIONS.INSTALL,
            });
            const taskFn = taskUtils.createPackageFromDefTask(testPackage, {});
            const taskResult = taskFn(mockCb);

            expect(packageUtils.installPackage).toBeCalledWith(testPackage);
            expect(mockCb).toBeCalledTimes(1);
            expect(taskResult).toEqual('cbReturn');

            expect(log.info.mock.calls).toMatchInlineSnapshot(`
                Array [
                  Array [
                    "Task ':packageName' created",
                  ],
                  Array [
                    "Verifying 'packageName'...",
                  ],
                  Array [
                    "Verification for 'packageName' failed. Proceeding with action 'install'...",
                  ],
                ]
            `);
        });

        it('throws if the package is not installed and verify action specified', () => {
            packageUtils.isPackageInstalled.mockReturnValue(false);

            const testPackage = new Package('packageName', {
                action: ACTIONS.VERIFY,
            });
            const taskFn = taskUtils.createPackageFromDefTask(testPackage, {});

            expect(() => {
                taskFn(mockCb);
            }).toThrowErrorMatchingInlineSnapshot(
                `"Package 'packageName' is not installed!"`,
            );
        });

        it('throws if the package action is not supported', () => {
            packageUtils.isPackageInstalled.mockReturnValue(false);

            const testPackage = new Package('packageName', {
                action: 'unsupportedAction',
            });
            const taskFn = taskUtils.createPackageFromDefTask(testPackage, {});

            expect(() => {
                taskFn(mockCb);
            }).toThrowErrorMatchingInlineSnapshot(
                `"Action 'unsupportedAction' for package 'packageName' is not supported."`,
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
