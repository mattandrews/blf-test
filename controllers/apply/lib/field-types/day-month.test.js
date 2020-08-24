/* eslint-env jest */
'use strict';
const DayMonthField = require('./day-month');

test('DayMonthField', function () {
    const field = new DayMonthField({
        locale: 'en',
        name: 'example',
        label: 'Day month field',
    });

    expect(field.type).toBe('day-month');
    expect(field.displayValue).toBe('');

    const goodInput = { day: 1, month: 3 };
    field.withValue(goodInput);
    expect(field.validate().error).toBeUndefined();
    expect(field.displayValue).toBe('1st March');

    const badInput = { day: 82, month: 3 };
    field.withValue(badInput);
    expect(field.displayValue).toBe('');
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('contains an invalid value')
    );
});
