module.exports = {
    env: {
        browser: true,
        mocha: true,
    },
    globals: {
        cy: false,
        Cypress: false,
        expect: false,
        assert: false,
    },
    parserOptions: {
        ecmaVersion: 2017,
        sourceType: 'module',
    },
    rules: {
        'node/no-unsupported-features/es-syntax': 'off',
        'node/no-unpublished-import': 'off',
    },
};
