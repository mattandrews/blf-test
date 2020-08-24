'use strict';
const get = require('lodash/fp/get');

const {
    MAX_BUDGET_TOTAL_GBP,
    MIN_BUDGET_TOTAL_GBP,
    FREE_TEXT_MAXLENGTH,
} = require('../constants');

const BudgetField = require('../../lib/field-types/budget');

module.exports = function (locale) {
    const localise = get(locale);
    const config = {
        min: MIN_BUDGET_TOTAL_GBP,
        max: MAX_BUDGET_TOTAL_GBP,
        rowLimit: 10,
        maxItemNameLength: FREE_TEXT_MAXLENGTH.large,
    };

    return new BudgetField({
        locale: locale,
        name: 'projectBudget',
        label: localise({
            en: 'List the costs you would like us to fund',
            cy: 'Rhestrwch y costau hoffech i ni eu hariannu',
        }),
        explanation: localise({
            en: `<p>
                    You should use budget headings, rather than a detailed list
                    of items. For example, if you're applying for pens, pencils,
                    paper and envelopes, using 'office supplies' is fine.
                    Please enter whole numbers only.
                </p>
                <p>Please note you can only have a maximum of 10 rows.</p>`,
            cy: `<p>
                    Dylech ddefnyddio penawdau llai, yn hytrach na rhestr hir
                    o eitemau. Er enghraifft, os ydych yn ymgeisio am feiros,
                    pensiliau, papur ac amlenni, byddai defnyddio
                    ‘offer swyddfa’ yn iawn. Rhowch y rhifau cyfan yn unig. 
                </p>
                <p>Sylwch mai dim ond uchafswm o 10 rhes gallwch ei gael.</p>`,
        }),
        attributes: {
            min: config.min,
            max: config.max,
            rowLimit: config.rowLimit,
        },
        min: config.min,
        max: config.max,
        rowLimit: config.rowLimit,
        maxItemNameLength: config.maxItemNameLength,
        isRequired: true,
    });
};
