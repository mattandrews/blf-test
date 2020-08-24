/* eslint-env jest */
'use strict';
const RadioField = require('./radio');

test('valid field', function () {
    const field = new RadioField({
        locale: 'en',
        name: 'example',
        label: 'Example field',
        options: [
            { label: 'Option 1', value: 'option-1' },
            { label: 'Option 2', value: 'option-2' },
        ],
        messages: [{ type: 'base', message: 'Select an option' }],
    });

    expect(field.type).toBe('radio');
    expect(field.displayValue).toBe('');

    field.withValue('option-1');
    expect(field.displayValue).toBe('Option 1');
    expect(field.validate().error).toBeUndefined();

    field.withValue('bad-option');
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('must be one of')
    );
});

test('required properties', function () {
    expect(() => {
        new RadioField({
            locale: 'en',
            name: 'example',
            label: 'Example field',
            messages: [{ type: 'base', message: 'Select an option' }],
        });
    }).toThrowError('Must provide options');

    expect(() => {
        new RadioField({
            locale: 'en',
            name: 'example',
            label: 'Example field',
            options: [
                { label: 'Option 1', value: 'duplicate-value' },
                { label: 'Option 2', value: 'duplicate-value' },
                { label: 'Option 3', value: 'option-3' },
            ],
            messages: [{ type: 'base', message: 'Select an option' }],
        });
    }).toThrowError('Options must contain unique values');
});
