/* eslint-env jest */
'use strict';
const CurrencyField = require('./currency');

test('valid field', function () {
    const field = new CurrencyField({
        locale: 'en',
        name: 'example',
        label: 'Currency field',
        messages: [{ type: 'base', message: 'Enter an amount' }],
    });

    expect(field.type).toBe('currency');
    expect(field.displayValue).toBe('');

    field.withValue('120,000');

    expect(field.validate().error).toBeUndefined();
    expect(field.validate().value).toBe(120000);
    expect(field.displayValue).toBe('£120,000');
});

test('optional field', function () {
    const field = new CurrencyField({
        locale: 'en',
        name: 'example',
        label: 'Currency field',
        isRequired: false,
    });

    expect(field.validate().error).toBeUndefined();
});
