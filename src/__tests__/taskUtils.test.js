const gulp = require('gulp');
const actionHandlers = require('../actionHandlers');
const { ACTIONS } = require('../constants');
const log = require('../log');
const packageUtils = require('../packageUtils');
const { definePhase } = require('../phaseUtils');
const { Target } = require('../Target');
const taskUtils = require('../taskUtils');

jest.mock('gulp');
jest.mock('../actionHandlers');
jest.mock('../packageUtils');
jest.mock('../log');

const defaultTestPackage = new Target('target-name', {
    action: 'action',
});

describe('createPackageFromDefTask', () => {
    it('returns and exports a task function, and sets the display name', () => {
        const testExports = {};
        const expectedTaskName = 'phase:target-name';

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
        const mockCb = jest.fn(() => 'done');

        beforeEach(() => {
            jest.clearAllMocks();
        });

        describe('action skipping', () => {
            it('skips the action if specified', () => {
                const testPackage = new Target('target-name', {
                    action: 'test-action',
                    skipAction: () => true,
                });
                const taskFn = taskUtils.createPackageFromDefTask(
                    testPackage,
                    {},
                );

                const taskResult = taskFn(mockCb);

                expect(mockCb).toBeCalledTimes(1);
                expect(taskResult).toEqual('done');

                expect(log.warn.mock.calls).toMatchInlineSnapshot(`
                    Array [
                      Array [
                        "Skipping action 'test-action' for target 'target-name'",
                      ],
                    ]
                `);
            });

            it('adds an optional reason for skipping the action', () => {
                const testPackage = new Target('target-name', {
                    action: 'test-action',
                    skipAction: () => true,
                    skipActionMessage: () => 'For reasons',
                });
                const taskFn = taskUtils.createPackageFromDefTask(
                    testPackage,
                    {},
                );

                taskFn(mockCb);

                expect(log.warn.mock.calls).toMatchInlineSnapshot(`
                    Array [
                      Array [
                        "Skipping action 'test-action' for target 'target-name': For reasons",
                      ],
                    ]
                `);
            });
        });

        it('runs the action handler against the target', () => {
            const testPackage = new Target('target-name', {
                action: ACTIONS.EXECUTE_JOBS,
            });
            const taskFn = taskUtils.createPackageFromDefTask(testPackage, {});
            const taskResult = taskFn(mockCb);

            expect(actionHandlers[testPackage.action]).toBeCalledWith(
                testPackage,
            );
            expect(mockCb).toBeCalledTimes(1);
            expect(taskResult).toEqual('done');
        });

        it('throws if the target action is not supported', () => {
            packageUtils.isPackageInstalled.mockReturnValue(false);

            const testPackage = new Target('target-name', {
                action: 'unsupportedAction',
            });
            const taskFn = taskUtils.createPackageFromDefTask(testPackage, {});

            expect(() => {
                taskFn(mockCb);
            }).toThrowErrorMatchingInlineSnapshot(
                `"Action 'unsupportedAction' for target 'target-name' is not supported: TypeError: actionHandlers[action] is not a function"`,
            );
        });
    });
});

describe('createPhaseTask', () => {
    const defaultPhaseName = 'testPhaseName';
    const defaultTargets = ['target-a', 'target-b', 'target-c'];

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

    ['INSTALL_PACKAGES', 'VERIFY_PACKAGES'].forEach((action) => {
        it(`creates tasks for ${action} action`, () => {
            const phaseDef = definePhase(
                defaultPhaseName,
                ACTIONS[action],
                defaultTargets,
            );

            const testExports = {};
            taskUtils.createPhaseTask(phaseDef, testExports);
            expect(testExports).toMatchSnapshot();
        });
    });

    it(`creates tasks for RUN_PHASES action`, () => {
        const phaseDef = definePhase(defaultPhaseName, ACTIONS.RUN_PHASES, [
            definePhase(
                defaultPhaseName,
                ACTIONS.INSTALL_PACKAGES,
                defaultTargets,
            ),
            definePhase(
                defaultPhaseName,
                ACTIONS.VERIFY_PACKAGES,
                defaultTargets,
            ),
        ]);

        const testExports = {};
        taskUtils.createPhaseTask(phaseDef, testExports);
        expect(testExports).toMatchSnapshot();
    });
});
