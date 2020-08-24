'use strict';
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions-next');
const { FREE_TEXT_MAXLENGTH } = require('../constants');
const Field = require('../../lib/field-types/field');

module.exports = function (locale) {
    const localise = get(locale);

    return new Field({
        locale: locale,
        name: 'buildingSocietyNumber',
        label: localise({
            en: 'Building society number',
            cy: 'Rhif cymdeithas adeiladu',
        }),
        attributes: { autocomplete: 'off' },
        explanation: localise({
            en: `You only need to fill this in if your organisation's account is with a building society.`,
            cy: `Rydych angen llenwi hwn os yw cyfrif eich sefydliad â chymdeithas adeiladu`,
        }),
        isRequired: false,
        schema: Joi.string().allow('').max(FREE_TEXT_MAXLENGTH.large).empty(),
        messages: [
            {
                type: 'string.max',
                message: localise({
                    en: `Building society number must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                    cy: `Rhaid i rif y Cymdeithas Adeiladu fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                }),
            },
        ],
    });
};
