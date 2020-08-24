/* eslint-env jest */
'use strict';
const AddressHistoryField = require('./address-history');

test('valid field', function () {
    const field = new AddressHistoryField({
        locale: 'en',
        name: 'example',
        label: 'Currency field',
        textMaxLengths: {
            small: 40,
            medium: 80,
            large: 255,
        },
    });

    expect(field.type).toBe('address-history');
    expect(field.displayValue).toBe('');

    field.withValue({
        currentAddressMeetsMinimum: 'yes',
        previousAddress: null,
    });
    expect(field.validate().error).toBeUndefined();
    expect(field.validate().value).toStrictEqual({
        currentAddressMeetsMinimum: 'yes',
    });
    expect(field.displayValue).toBe('Yes');

    field.withValue({
        currentAddressMeetsMinimum: 'no',
        previousAddress: {
            line1: 'Address line 1',
            line2: 'Address line 2',
            townCity: 'Some Town',
            county: 'Some County',
            postcode: 'B15 1TR',
        },
    });
    expect(field.validate().error).toBeUndefined();
    expect(field.validate().value).toStrictEqual({
        currentAddressMeetsMinimum: 'no',
        previousAddress: {
            line1: 'Address line 1',
            line2: 'Address line 2',
            townCity: 'Some Town',
            county: 'Some County',
            postcode: 'B15 1TR',
        },
    });
    expect(field.displayValue).toBe(
        'Address line 1,\nAddress line 2,\nSome Town,\nSome County,\nB15 1TR'
    );
});

test('invalid field', function () {
    const field = new AddressHistoryField({
        locale: 'en',
        name: 'example',
        label: 'Currency field',
        textMaxLengths: {
            small: 10,
            medium: 20,
            large: 30,
        },
    });

    field.withValue({
        currentAddressMeetsMinimum: 'no',
        previousAddress: {
            line1: 'Address line 1',
            line2: 'Address line 2',
            townCity:
                'Really long address line which will be too long for the validator',
            county: 'Some County',
            postcode: 'not a postcode',
        },
    });
    expect(field.validate().error.message).toEqual(
        expect.stringContaining(
            '"previousAddress.townCity" length must be less than or equal to 40 characters long'
        )
    );

    field.withValue({
        currentAddressMeetsMinimum: 'no',
        previousAddress: {},
    });
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('"previousAddress.line1" is required')
    );
});
