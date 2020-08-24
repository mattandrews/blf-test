/* eslint-env jest */
'use strict';
const SelectField = require('./select');

test('select field', function () {
    const field = new SelectField({
        locale: 'en',
        name: 'example',
        label: 'Example field',
        options: [
            { label: 'Option 1', value: 'option-1' },
            { label: 'Option 2', value: 'option-2' },
            { label: 'Option 3', value: 'option-3' },
        ],
        messages: [{ type: 'base', message: 'Select an option' }],
    });

    expect(field.type).toBe('select');
    expect(field.displayValue).toBe('');

    field.withValue('option-2');
    expect(field.displayValue).toBe('Option 2');
    expect(field.validate().error).toBeUndefined();

    field.withValue('bad-option');
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('must be one of')
    );
});

test('select field supports optgroups', function () {
    const field = new SelectField({
        locale: 'en',
        name: 'example',
        label: 'Example field',
        defaultOption: 'Select an option',
        optgroups: [
            {
                label: 'Group 1',
                options: [{ label: 'Option 1', value: 'option-1' }],
            },
            {
                label: 'Group 2',
                options: [{ label: 'Option 2', value: 'option-2' }],
            },
        ],
        messages: [{ type: 'base', message: 'Select an option' }],
    });

    expect(field.normalisedOptions).toEqual([
        { label: 'Option 1', value: 'option-1' },
        { label: 'Option 2', value: 'option-2' },
    ]);
});

test('required properties', function () {
    expect(() => {
        new SelectField({
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

    expect(() => {
        new SelectField({
            locale: 'en',
            name: 'example',
            label: 'Example field',
            defaultOption: 'Select an option',
            optgroups: [
                {
                    label: 'Group 1',
                    options: [{ label: 'Option 1', value: 'duplicate-value' }],
                },
                {
                    label: 'Group 2',
                    options: [{ label: 'Option 2', value: 'duplicate-value' }],
                },
            ],
            messages: [{ type: 'base', message: 'Select an option' }],
        });
    }).toThrowError('Options must contain unique values');

    expect(() => {
        new SelectField({
            locale: 'en',
            name: 'example',
            label: 'Example field',
            optgroups: [
                {
                    label: 'Group 1',
                    options: [{ label: 'Option 1', value: 'duplicate-value' }],
                },
            ],
            messages: [{ type: 'base', message: 'Select an option' }],
        });
    }).toThrowError('Must provide default option when using optgroups');
});
