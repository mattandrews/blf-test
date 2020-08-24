/* eslint-env jest */
'use strict';
const FileField = require('./file');

test('FileField', function () {
    const field = new FileField({
        locale: 'en',
        name: 'example',
        label: 'File field',
        messages: [{ type: 'base', message: 'Please provide a file' }],
    });

    expect(field.type).toBe('file');
    expect(field.displayValue).toBe('');

    field.withValue({
        filename: 'example.pdf',
        size: 13264,
        type: 'application/pdf',
    });
    expect(field.validate().error).toBeUndefined();
    expect(field.displayValue).toBe('example.pdf (PDF, 13 KB)');

    field.withValue({
        filename: 'example.js',
        size: 13264,
        type: 'application/javascript',
    });
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('"type" must be one of')
    );

    // Unknown file type
    field.withValue({
        filename: 'example.madeup',
        size: 13264,
        type: 'application/not-a-thing',
    });
    expect(field.displayValue).toBe('example.madeup (13 KB)');
});
