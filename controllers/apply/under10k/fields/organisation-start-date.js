'use strict';
const get = require('lodash/fp/get');
const moment = require('moment');

const MonthYearField = require('../../lib/field-types/month-year');

module.exports = function (locale) {
    const localise = get(locale);

    const exampleYear = moment().subtract('5', 'years').format('YYYY');

    return new MonthYearField({
        locale: locale,
        name: 'organisationStartDate',
        label: localise({
            en: `When was your organisation set up?`,
            cy: `Pryd sefydlwyd eich sefydliad?`,
        }),
        explanation: localise({
            en: `<p>Please tell us the month and year.</p>
                 <p><strong>For example: 11 ${exampleYear}</strong></p>`,
            cy: `<p>Dywedwch wrthym y mis a’r flwyddyn.</p>
                 <p><strong>Er enghraifft: 11 ${exampleYear}</strong></p>`,
        }),
        isRequired: true,
    });
};
