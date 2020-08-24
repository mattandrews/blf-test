/* eslint-env jest */
'use strict';
const BudgetField = require('./budget');

test('valid field', function () {
    const field = new BudgetField({
        locale: 'en',
        name: 'example',
        label: 'Example field',
        min: 300,
        max: 700,
        rowLimit: 5,
        maxItemNameLength: 30,
    });

    expect(field.type).toBe('budget');
    expect(field.displayValue).toBe('');

    field.withValue([
        {
            item: 'New boiler',
            cost: 400,
        },
        {
            item: 'Posters',
            cost: 20,
        },
    ]);
    expect(field.displayValue).toBe(
        'New boiler – £400\nPosters – £20\nTotal: £420'
    );
    expect(field.validate().error).toBeUndefined();
});

test('field under budget', function () {
    const field = new BudgetField({
        locale: 'en',
        name: 'example',
        label: 'Example field',
        min: 300,
        max: 700,
        rowLimit: 5,
        maxItemNameLength: 30,
    });
    field.withValue([
        {
            item: 'pencils',
            cost: 5,
        },
    ]);
    expect(field.displayValue).toBe('pencils – £5\nTotal: £5');
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('under minimum budget')
    );
});
test('field with too many items', function () {
    const field = new BudgetField({
        locale: 'en',
        name: 'example',
        label: 'Example field',
        min: 300,
        max: 700,
        rowLimit: 5,
        maxItemNameLength: 30,
    });
    field.withValue([
        {
            item: 'item 1',
            cost: 100,
        },
        {
            item: 'item 2',
            cost: 100,
        },
        {
            item: 'item 3',
            cost: 100,
        },
        {
            item: 'item 4',
            cost: 100,
        },
        {
            item: 'item 5',
            cost: 100,
        },
        {
            item: 'item 6',
            cost: 100,
        },
    ]);
    expect(field.displayValue).toBe(
        'item 1 – £100\nitem 2 – £100\nitem 3 – £100\nitem 4 – £100\nitem 5 – £100\nitem 6 – £100\nTotal: £600'
    );
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('must contain less than or equal to 5 items')
    );
});

test('field over budget', function () {
    const field = new BudgetField({
        locale: 'en',
        name: 'example',
        label: 'Example field',
        min: 300,
        max: 700,
        rowLimit: 5,
        maxItemNameLength: 30,
    });
    field.withValue([
        {
            item: 'Ferrari',
            cost: 53287433,
        },
    ]);
    expect(field.displayValue).toBe(
        'Ferrari – £53,287,433\nTotal: £53,287,433'
    );
    expect(field.validate().error.message).toEqual(
        expect.stringContaining('over maximum budget')
    );
});
