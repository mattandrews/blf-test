'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions-next');
const Field = require('../../lib/field-types/field');

module.exports = function (locale) {
    const localise = get(locale);

    return new Field({
        locale: locale,
        name: 'projectPostcode',
        label: localise({
            en: `What is the postcode of where your project will take place?`,
            cy: `Beth yw côd post lleoliad eich prosiect?`,
        }),
        explanation: localise({
            en: oneLine`If your project will take place across different locations,
                please use the postcode where most of the project will take place.`,
            cy: oneLine`Os bydd eich prosiect wedi’i leoli mewn amryw o leoliadau,
                defnyddiwch y côd post lle bydd y rhan fwyaf o’r prosiect wedi’i leoli.`,
        }),
        attributes: { size: 10, autocomplete: 'postal-code' },
        schema: Joi.string().postcode().required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a real postcode',
                    cy: 'Rhowch gôd post go iawn',
                }),
            },
        ],
    });
};
