/* eslint-env jest */
'use strict';
const NameField = require('./name');

test('NameField', function () {
    const field = new NameField({
        locale: 'en',
        name: 'example',
        label: 'Name field',
    });

    expect(field.displayValue).toBe('');

    field.withValue({});
    expect(field.type).toBe('full-name');
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('"firstName" is required')
    );

    field.withValue({ firstName: 'Björk', lastName: 'Guðmundsdóttir' });
    expect(field.validate().error).toBeUndefined();
    expect(field.displayValue).toBe('Björk Guðmundsdóttir');
});
