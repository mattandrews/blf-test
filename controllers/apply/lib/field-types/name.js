'use strict';
const Joi = require('../joi-extensions-next');

const Field = require('./field');

class NameField extends Field {
    getType() {
        return 'full-name';
    }

    defaultSchema() {
        return Joi.object({
            firstName: Joi.string().trim().max(40).required(),
            lastName: Joi.string().trim().max(80).required(),
        }).required();
    }

    defaultMessages() {
        return [
            {
                type: 'base',
                message: this.localise({
                    en: 'Enter first and last name',
                    cy: 'Rhowch enw cyntaf a chyfenw',
                }),
            },
            {
                type: 'any.empty',
                key: 'firstName',
                message: this.localise({
                    en: 'Enter first name',
                    cy: 'Rhowch enw cyntaf',
                }),
            },
            {
                type: 'string.max',
                key: 'firstName',
                message: this.localise({
                    en: `First name must be 40 characters or less`,
                    cy: `Rhaid i’r enw cyntaf fod yn llai na 40 nod`,
                }),
            },
            {
                type: 'string.max',
                key: 'lastName',
                message: this.localise({
                    en: `Last name must be 80 characters or less`,
                    cy: `Rhaid i’r cyfenw fod yn llai na 80 nod`,
                }),
            },
            {
                type: 'any.empty',
                key: 'lastName',
                message: this.localise({
                    en: 'Enter last name',
                    cy: 'Rhowch gyfenw',
                }),
            },
        ];
    }

    get displayValue() {
        if (this.value) {
            return `${this.value.firstName} ${this.value.lastName}`;
        } else {
            return '';
        }
    }
}

module.exports = NameField;
