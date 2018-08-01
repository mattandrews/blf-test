'use strict';

module.exports = {
    root: true,
    extends: 'eslint:recommended',
    env: {
        es6: true,
        node: true
    },
    parserOptions: {
        ecmaVersion: 9
    },
    rules: {
        'no-console': 'off',
        'no-shadow': 'warn',
        'no-unused-vars': 'warn',
        eqeqeq: 'error',
        semi: ['error', 'always'],
        strict: ['warn', 'safe']
    }
};
