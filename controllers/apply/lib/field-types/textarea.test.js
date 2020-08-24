/* eslint-env jest */
'use strict';
const faker = require('faker');

const TextareaField = require('./textarea');

test('TextareaField', function () {
    const minWords = 50;
    const maxWords = 150;

    const field = new TextareaField({
        locale: 'en',
        name: 'example',
        label: 'Textarea field',
        minWords: minWords,
        maxWords: maxWords,
        messages: [{ type: 'base', message: 'Enter a value' }],
    });

    expect(field.type).toBe('textarea');
    expect(field.displayValue).toBe('');

    const goodValue = faker.lorem.words(minWords + 1);

    field.withValue(goodValue);
    expect(field.displayValue).toEqual(
        `${goodValue}\n\n${minWords + 1}/${maxWords} words`
    );
    expect(field.validate().error).toBeUndefined();

    field.withValue(faker.lorem.words(minWords - 1));
    expect(field.validate().error.message).toEqual(
        expect.stringContaining(`must have at least ${minWords} words`)
    );

    field.withValue(faker.lorem.words(maxWords + 1));
    expect(field.validate().error.message).toEqual(
        expect.stringContaining(`must have no more than ${maxWords} words`)
    );

    const optionalField = new TextareaField({
        locale: 'en',
        name: 'example',
        isRequired: false,
        label: 'Radio field',
        minWords: minWords,
        maxWords: maxWords,
        messages: [{ type: 'base', message: 'Enter a value' }],
    });

    expect(optionalField.validate().error).toBeUndefined();
});

test('required properties', function () {
    expect(() => {
        new TextareaField({
            locale: 'en',
            name: 'example',
            label: 'Example field',
            messages: [{ type: 'base', message: 'Enter a value' }],
        });
    }).toThrowError('Must provide minWords and maxWords');
});
