/* eslint-env jest */
'use strict';
const AddressField = require('./address');

test('address field', function () {
    const field = new AddressField({
        locale: 'en',
        name: 'example',
        label: 'Address field',
    });

    expect(field.type).toBe('address');
    expect(field.displayValue).toBe('');

    field.withValue({
        line1: '1234 example street',
        townCity: 'Birmingham',
        county: 'West Midlands',
    });

    expect(field.validate().error.message).toEqual(
        expect.stringContaining(`"postcode" is required`)
    );

    field.withValue({
        line1: '1234 example street',
        line2: 'Edgbaston',
        townCity: 'Birmingham',
        county: 'West Midlands',
        postcode: 'B15 1TR',
    });

    expect(field.validate().error).toBeUndefined();
    expect(field.displayValue).toBe(
        '1234 example street,\nEdgbaston,\nBirmingham,\nWest Midlands,\nB15 1TR'
    );
});
