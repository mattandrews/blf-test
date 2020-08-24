'use strict';
const get = require('lodash/fp/get');

const { COMPANY_NUMBER_TYPES, FREE_TEXT_MAXLENGTH } = require('../constants');
const Joi = require('../../lib/joi-extensions-next');
const Field = require('../../lib/field-types/field');

const { stripUnlessOrgTypes } = require('./organisation-type');

module.exports = function (locale) {
    const localise = get(locale);

    return new Field({
        locale: locale,
        name: 'companyNumber',
        label: localise({
            en: 'Companies House number',
            cy: 'Rhif Tŷ’r Cwmnïau',
        }),
        isRequired: true,
        schema: stripUnlessOrgTypes(
            COMPANY_NUMBER_TYPES,
            Joi.string().max(FREE_TEXT_MAXLENGTH.large).required()
        ),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter your organisation’s Companies House number',
                    cy: 'Rhowch rif Tŷ’r Cwmnïau eich sefydliad',
                }),
            },
            {
                type: 'string.max',
                message: localise({
                    en: `Companies House number must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                    cy: `Rhaid i’r rhif Tŷ’r Cwmnïau fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                }),
            },
        ],
    });
};
