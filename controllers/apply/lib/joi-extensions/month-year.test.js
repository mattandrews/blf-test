/* eslint-env jest */
'use strict';
const Joi = require('./index');

test('valid month-year', () => {
    const schema = Joi.monthYear();

    const valid = schema.validate({ month: '2', year: '2020' });
    expect(valid.value).toEqual({ month: 2, year: 2020 });
    expect(valid.error).toBeUndefined();

    const missingMonth = schema.validate({ year: 2000 });
    expect(missingMonth.error.message).toContain('"month" is required');

    const missingYear = schema.validate({ month: 2 });
    expect(missingYear.error.message).toContain('"year" is required');

    const invalidDate = schema.validate({ month: 31, year: 2000 });
    expect(invalidDate.error.message).toContain('contains an invalid value');
});

test('four digit year', () => {
    const schema = Joi.monthYear();
    const invalidDate = schema.validate({ month: 3, year: 100 });
    expect(invalidDate.error.message).toContain(
        '"year" must be greater than or equal to 1000'
    );
});

test('date must be in the past', () => {
    const schema = Joi.monthYear().pastDate();
    const invalidDate = schema.validate({ month: 3, year: 2100 });
    expect(invalidDate.error.message).toContain('must be in the past');
});
