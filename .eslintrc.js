module.exports = {
    env: {
        'jest/globals': true,
        commonjs: true,
        es2021: true,
        node: true,
    },
    extends: ['eslint:recommended', 'plugin:jest/recommended', 'prettier'],
    parserOptions: {
        ecmaVersion: 12,
    },
    plugins: ['jest'],
    rules: {},
};
