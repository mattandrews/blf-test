/* eslint-env jest */
'use strict';
const Field = require('./field');
const Joi = require('../joi-extensions-next');

test('field base type', function () {
    const field = new Field({
        locale: 'en',
        name: 'example',
        label: 'Example field',
        messages: [{ type: 'base', message: 'Enter a value' }],
    });

    expect(field.locale).toBe('en');
    expect(field.label).toEqual('Example field');
    expect(field.defaultLabel()).toBeNull(); // For sub-classes

    expect(field.name).toBe('example');
    expect(field.getType()).toBe('text');
    expect(field.type).toBe('text');
    expect(field.isRequired).toBeTruthy();

    expect(field.displayValue).toBe('');

    field.withValue();
    expect(field.displayValue).toBe('');
    expect(field.validate().error.message).toEqual('"value" is required');

    field.withValue('something');
    expect(field.displayValue).toBe('something');
    expect(field.validate().error).toBeUndefined();
});

test('required properties', function () {
    expect(() => {
        new Field({
            label: 'Example field',
            messages: [{ type: 'base', message: 'Enter a value' }],
        });
    }).toThrowError('Must provide name');

    expect(() => {
        new Field({
            name: 'example',
            label: 'Example field',
            messages: [{ type: 'base', message: 'Enter a value' }],
        });
    }).toThrowError('Must provide locale');

    expect(() => {
        new Field({
            locale: 'en',
            name: 'example',
            messages: [{ type: 'base', message: 'Enter a value' }],
        });
    }).toThrowError('Must provide label');

    expect(() => {
        new Field({
            locale: 'en',
            name: 'example',
            label: 'Example field',
        }).messages;
    }).toThrowError('Required fields must provide a base error message');
});

test('optional default field', function () {
    const optionalField = new Field({
        locale: 'en',
        name: 'example',
        label: 'Optional text field',
        isRequired: false,
    });

    expect(optionalField.isRequired).toBeFalsy();
    expect(optionalField.validate().error).toBeUndefined();
});

test('with errors', function () {
    const field = new Field({
        locale: 'en',
        name: 'example',
        label: 'Text field',
        messages: [{ type: 'base', message: 'Enter a value' }],
    });

    const mockErrors = [
        { param: 'example', msg: 'Enter a value', type: 'base' },
    ];

    field.withErrors(mockErrors);
    field.withFeaturedErrors(mockErrors);
    expect(field.errors).toEqual(mockErrors);
    expect(field.featuredErrors).toEqual(mockErrors);
});

test('override schema', function () {
    const field = new Field({
        locale: 'en',
        name: 'example',
        label: 'Custom label',
        type: 'base64',
        schema: Joi.string().base64().required(),
        messages: [{ type: 'base', message: 'Enter a value' }],
    });

    expect(field.type).toBe('base64');

    field.withValue('VE9PTUFOWVNFQ1JFVFM=');
    expect(field.displayValue).toBe('VE9PTUFOWVNFQ1JFVFM=');
    expect(field.validate().error).toBeUndefined();

    field.withValue('VE9PTUFOWVNFQ1JFVFM');
    expect(field.validate().error.message).toContain(
        'must be a valid base64 string'
    );
});

test('extend schema with a function', function () {
    const field = new Field({
        locale: 'en',
        name: 'example',
        label: 'Custom label',
        type: 'base64',
        schema(originalSchema) {
            return originalSchema.base64();
        },
        messages: [{ type: 'base', message: 'Enter a value' }],
    });

    expect(field.type).toBe('base64');

    field.withValue('VE9PTUFOWVNFQ1JFVFM=');
    expect(field.displayValue).toBe('VE9PTUFOWVNFQ1JFVFM=');
    expect(field.validate().error).toBeUndefined();

    field.withValue('VE9PTUFOWVNFQ1JFVFM');
    expect(field.validate().error.message).toContain(
        'must be a valid base64 string'
    );
});

test('localise helper', function () {
    expect(
        new Field({
            locale: 'en',
            name: 'example',
            label: 'Text field',
            messages: [{ type: 'base', message: 'Enter a value' }],
        }).localise({ en: 'english', cy: 'welsh' })
    ).toEqual('english');

    expect(
        new Field({
            locale: 'cy',
            name: 'example',
            label: 'Text field',
            messages: [{ type: 'base', message: 'Enter a value' }],
        }).localise({ en: 'english', cy: 'welsh' })
    ).toEqual('welsh');
});

test('field extension', function () {
    class CustomField extends Field {
        getType() {
            return 'custom-type';
        }
        defaultAttributes() {
            return { custom: 'true' };
        }
        defaultLabel() {
            return 'Default label';
        }
        defaultSchema() {
            return Joi.number().required();
        }
        defaultMessages() {
            return [{ type: 'base', message: 'Example message' }];
        }
    }

    const minimalField = new CustomField({
        locale: 'en',
        name: 'example',
    });

    expect(minimalField.type).toEqual('custom-type');
    expect(minimalField.defaultLabel()).toEqual('Default label');
    expect(minimalField.label).toEqual('Default label');
    expect(minimalField.messages).toEqual([
        { type: 'base', message: 'Example message' },
    ]);

    minimalField.withValue('something');
    expect(minimalField.validate().error.message).toEqual(
        '"value" must be a number'
    );

    const fieldWithProps = new CustomField({
        locale: 'en',
        name: 'example',
        label: 'Custom label',
    });
    expect(fieldWithProps.label).toEqual('Custom label');
});
