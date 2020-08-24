/* eslint-env jest */
'use strict';
const PhoneField = require('./phone');

test('valid field', function () {
    const field = new PhoneField({
        locale: 'en',
        name: 'example',
    });

    expect(field.label).toBe('Telephone number');
    expect(field.type).toBe('tel');

    const goodValue = '028 9568 0143';
    const badValue = '0345 444';

    field.withValue(goodValue);
    expect(field.validate().error).toBeUndefined();
    expect(field.validate().value).toBe('028 9568 0143');

    field.withValue(badValue);
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('did not seem to be a phone number')
    );
});

test('optional field', function () {
    const field = new PhoneField({
        locale: 'en',
        name: 'example',
        isRequired: false,
    });

    expect(field.validate().error).toBeUndefined();

    field.withValue('');
    expect(field.validate().error).toBeUndefined();
});
