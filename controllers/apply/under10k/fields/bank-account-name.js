'use strict';
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions-next');
const { FREE_TEXT_MAXLENGTH } = require('../constants');
const Field = require('../../lib/field-types/field');

module.exports = function (locale) {
    const localise = get(locale);

    return new Field({
        locale: locale,
        name: 'bankAccountName',
        label: localise({
            en: `Tell us the name of your organisation - as it appears on the bank statement`,
            cy: `Dywedwch wrthym enw eich sefydliad – fel mae’n ymddangos ar eich cyfriflen banc`,
        }),
        explanation: localise({
            en: `Not the name of your bank`,
            cy: `Nid enw eich banc`,
        }),
        attributes: { autocomplete: 'off' },
        isRequired: true,
        schema: Joi.string().max(FREE_TEXT_MAXLENGTH.large).required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: `Enter the name of your organisation, as it appears on your bank statement`,
                    cy: `Rhowch enw eich sefydliad, fel mae’n ymddangos ar eich cyfriflen banc`,
                }),
            },
            {
                type: 'string.max',
                message: localise({
                    en: `Name of your organisation must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                    cy: `Rhaid i enw eich sefydliad fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                }),
            },
        ],
    });
};
