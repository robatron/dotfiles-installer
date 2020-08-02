const path = require('path');
const {
    createPhaseTaskTree,
    fileExists,
    ACTIONS,
    PLATFORM: { IS_LINUX },
    createPhaseDef,
    createPhaseDefTreeRoot,
} = require('../index');

const defaultTestTargets = [
    // String targets
    'curl',
    'git',
    'node',
    'npm',

    // Targets with metadata
    [
        'nvm',
        {
            testFn: (pkg) =>
                fileExists(
                    path.join(
                        process.env['NVM_DIR'] ||
                            path.join(process.env['HOME'], `.${pkg.name}`),
                        `${pkg.name}.sh`,
                    ),
                ),
        },
    ],
];

describe('createPhaseDef', () => {
    it('creates a phase definition', () => {
        const phaseName = 'test-phase-name';
        const action = ACTIONS.VERIFY;
        const opts = { parallel: true };
        const targets = defaultTestTargets;

        const actual = createPhaseDef(phaseName, action, targets, opts);
        const expected = [
            phaseName,
            {
                ...opts,
                action,
                targets,
            },
        ];

        expect(actual).toStrictEqual(expected);
    });
});

describe('createPhaseDefTreeRoot', () => {
    it('creates a root phase definition', () => {
        const targets = defaultTestTargets;
        const parallel = true;

        const actual = createPhaseDefTreeRoot(targets, parallel);
        const expected = [
            [
                'default',
                {
                    action: ACTIONS.RUN_PHASES,
                    parallel,
                    targets,
                },
            ],
        ];

        expect(actual).toStrictEqual(expected);
    });
});

describe('createPhaseTaskTree', () => {});

describe('fileExists', () => {
    it('returns true if a file exists', () => {
        const targetFilePath = path.join(__dirname, 'index.test.js');
        expect(fileExists(targetFilePath)).toBe(true);
    });

    it('returns false if a file does not exist', () => {
        const targetFilePath = path.join(__dirname, 'non-existant-file.ext');
        expect(fileExists(targetFilePath)).toBe(false);
    });
});
