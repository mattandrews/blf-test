/* eslint-env jest */
'use strict';
const percentagesFor = require('./percentages');

test('percentagesFor', function () {
    const responses = [
        ...Array(500).fill({ choice: 'yes' }),
        ...Array(50).fill({ path: 'no' }),
    ];

    expect(percentagesFor(responses)).toEqual({
        percentageYes: '90.9',
        yesCount: 500,
        noCount: 50,
    });
});
