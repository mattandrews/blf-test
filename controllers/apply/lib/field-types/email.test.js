/* eslint-env jest */
'use strict';
const EmailField = require('./email');

test('valid field', function () {
    const field = new EmailField({
        locale: 'en',
        name: 'example',
    });

    expect(field.type).toBe('email');
    expect(field.label).toBe('Email');

    const goodInput = 'example@example.com';
    const badInput = 'not.a.real-email@bad';

    field.withValue(goodInput);
    expect(field.validate().error).toBeUndefined();
    expect(field.displayValue).toBe(goodInput);

    field.withValue(badInput);
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('must be a valid email')
    );
});

test('optional field', function () {
    const field = new EmailField({
        locale: 'en',
        name: 'example',
        isRequired: false,
    });
    expect(field.validate().error).toBeUndefined();
});
