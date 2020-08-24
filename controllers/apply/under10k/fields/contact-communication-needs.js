'use strict';
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions-next');
const { FREE_TEXT_MAXLENGTH } = require('../constants');
const Field = require('../../lib/field-types/field');

module.exports = function (locale, props) {
    const localise = get(locale);
    const defaultProps = {
        locale: locale,
        name: 'seniorContactCommunicationNeeds',
        label: localise({
            en: `Please tell us about any particular communication needs this contact has.`,
            cy: `Dywedwch wrthym am unrhyw anghenion cyfathrebu sydd gan y cyswllt hwn.`,
        }),
        isRequired: false,
        schema: Joi.string()
            .allow('')
            .max(FREE_TEXT_MAXLENGTH.large)
            .optional(),
        messages: [
            {
                type: 'string.max',
                message: localise({
                    en: `Particular communication needs must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                    cy: `Rhaid i’r anghenion cyfathrebu penodol fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                }),
            },
        ],
    };
    return new Field({ ...defaultProps, ...props });
};
