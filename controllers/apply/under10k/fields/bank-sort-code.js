'use strict';
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions-next');
const Field = require('../../lib/field-types/field');

module.exports = function (locale) {
    const localise = get(locale);

    return new Field({
        locale: locale,
        name: 'bankSortCode',
        label: localise({ en: 'Sort code', cy: 'Cod didoli' }),
        explanation: localise({ en: 'eg. 123456', cy: 'e.e. 123456' }),
        attributes: { size: 20, autocomplete: 'off' },
        schema: Joi.string().replace(/\D/g, '').length(6).required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a sort code',
                    cy: 'Rhowch god didoli',
                }),
            },
            {
                type: 'string.length',
                message: localise({
                    en: 'Sort code must be six digits long',
                    cy: 'Rhaid i’r cod didoli fod yn chwe digid o hyd',
                }),
            },
        ],
    });
};
