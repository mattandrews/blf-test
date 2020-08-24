'use strict';
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions-next');
const Field = require('../../lib/field-types/field');

module.exports = function (locale) {
    const localise = get(locale);

    return new Field({
        locale: locale,
        name: 'bankAccountNumber',
        label: localise({ en: 'Account number', cy: 'Rhif cyfrif' }),
        explanation: localise({ en: 'eg. 12345678', cy: 'e.e. 12345678' }),
        attributes: { autocomplete: 'off' },
        schema: Joi.string().replace(/\D/g, '').min(6).max(11).required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter an account number',
                    cy: 'Rhowch rif cyfrif',
                }),
            },
            {
                type: 'string.min',
                message: localise({
                    en: 'Enter a valid length account number',
                    cy: 'Rhowch rif cyfrif hyd dilys',
                }),
            },
            {
                type: 'string.max',
                message: localise({
                    en: 'Enter a valid length account number',
                    cy: 'Rhowch rif cyfrif hyd dilys',
                }),
            },
        ],
    });
};
