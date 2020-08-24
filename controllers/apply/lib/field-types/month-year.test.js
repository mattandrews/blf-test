/* eslint-env jest */
'use strict';
const MonthYearField = require('./month-year');

test('MonthYearField', function () {
    const field = new MonthYearField({
        locale: 'en',
        name: 'example',
        label: 'Month year field',
    });

    expect(field.type).toBe('month-year');
    expect(field.displayValue).toBe('');

    const goodInput = { year: 1986, month: 9 };
    field.withValue(goodInput);
    expect(field.validate().error).toBeUndefined();
    expect(field.displayValue).toBe('1st September');

    const badInput = { year: 3000, month: 1 };
    field.withValue(badInput);
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('must be in the past')
    );

    const invalidInput = { year: 3000, month: 2000 };
    field.withValue(invalidInput);
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('contains an invalid value')
    );
});
