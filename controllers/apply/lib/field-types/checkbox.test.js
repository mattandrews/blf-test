/* eslint-env jest */
'use strict';
const CheckboxField = require('./checkbox');

test('valid field', function () {
    const field = new CheckboxField({
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

    expect(field.type).toBe('checkbox');
    expect(field.displayValue).toBe('');

    field.withValue(['option-1', 'option-2']);
    expect(field.displayValue).toBe('Option 1,\nOption 2');
    expect(field.validate().error).toBeUndefined();

    field.withValue(['bad-option']);
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('must be one of')
    );
});

test('valid field with optgroups', function () {
    const field = new CheckboxField({
        locale: 'en',
        name: 'example',
        label: 'Example field',
        options: [
            { label: 'Option 1', value: 'option-1' },
            { label: 'Option 2', value: 'option-2' },
            { label: 'Option 3', value: 'option-3' },
        ],
        optgroups: [
            {
                label: 'Midlands',
                options: [
                    {
                        value: 'east-midlands',
                        label: 'East Midlands',
                    },
                    {
                        value: 'west-midlands',
                        label: 'West Midlands',
                    },
                ],
            },
            {
                label: 'London',
                options: [
                    {
                        value: 'north-london',
                        label: 'North London',
                    },
                    {
                        value: 'south-london',
                        label: 'South London',
                    },
                ],
            },
        ],
        messages: [{ type: 'base', message: 'Select an option' }],
    });

    expect(field.type).toBe('checkbox');
    expect(field.displayValue).toBe('');

    field.withValue(['west-midlands', 'south-london']);
    expect(field.displayValue).toBe('West Midlands,\nSouth London');
    expect(field.validate().error).toBeUndefined();

    field.withValue(['bad-option']);
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('must be one of')
    );
});

test('optional field', function () {
    const field = new CheckboxField({
        locale: 'en',
        name: 'example',
        label: 'Example field',
        isRequired: false,
        options: [
            { label: 'Option 1', value: 'option-1' },
            { label: 'Option 2', value: 'option-2' },
            { label: 'Option 3', value: 'option-3' },
        ],
    });

    expect(field.validate().error).toBeUndefined();
});

test('must provide options', function () {
    expect(() => {
        new CheckboxField({
            locale: 'en',
            name: 'example',
            label: 'Example field',
            messages: [{ type: 'base', message: 'Select an option' }],
        });
    }).toThrowError('Must provide either options or optgroups');
});

test('options must contain unique values', function () {
    expect(() => {
        new CheckboxField({
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
