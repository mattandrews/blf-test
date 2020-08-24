/* eslint-env jest */
'use strict';
const DateField = require('./date');

test('DateField', function () {
    const field = new DateField({
        locale: 'en',
        name: 'example',
        label: 'Date field',
        messages: [{ type: 'base', message: 'Enter a date' }],
    });

    expect(field.type).toBe('date');
    expect(field.displayValue).toBe('');

    const goodInput = { day: 1, month: 3, year: 2100 };
    const badInput = { day: 82, month: 3, year: 2100 };

    field.withValue(goodInput);
    expect(field.validate().error).toBeUndefined();
    expect(field.displayValue).toBe('1 March, 2100');

    field.withValue(badInput);
    expect(field.displayValue).toBe('');
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('contains an invalid value')
    );
});
