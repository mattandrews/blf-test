'use strict';
const { oneLine } = require('common-tags');
const Joi = require('../joi-extensions-next');

const Field = require('./field');

class EmailField extends Field {
    getType() {
        return 'email';
    }

    defaultAttributes() {
        return { size: 40, autocomplete: 'email' };
    }

    defaultLabel() {
        return this.localise({
            en: 'Email',
            cy: 'E-bost',
        });
    }

    defaultSchema() {
        const baseSchema = Joi.string().email();
        return this.isRequired ? baseSchema.required() : baseSchema.optional();
    }

    defaultMessages() {
        return [
            {
                type: 'base',
                message: this.localise({
                    en: 'Enter an email address',
                    cy: 'Rhowch gyfeiriad e-bost',
                }),
            },
            {
                type: 'string.email',
                message: this.localise({
                    en: oneLine`Email address must be in the correct format,
                        like name@example.com`,
                    cy: oneLine`Rhaid i’r cyfeiriad e-bost for yn y ffurf cywir,
                        e.e enw@example.com`,
                }),
            },
        ];
    }
}

module.exports = EmailField;
