'use strict';
const Joi = require('../joi-extensions-next');

const Field = require('./field');

class PhoneField extends Field {
    getType() {
        return 'tel';
    }

    defaultAttributes() {
        return { size: 40, autocomplete: 'tel' };
    }

    defaultLabel() {
        return this.localise({
            en: `Telephone number`,
            cy: `Rhif ffôn`,
        });
    }

    defaultSchema() {
        const baseSchema = Joi.string().phoneNumber();
        return this.isRequired
            ? baseSchema.required()
            : baseSchema.allow('').optional();
    }

    defaultMessages() {
        return [
            {
                type: 'base',
                message: this.localise({
                    en: 'Enter a UK telephone number',
                    cy: 'Rhowch rif ffôn Prydeinig',
                }),
            },
            {
                type: 'string.phonenumber',
                message: this.localise({
                    en: 'Enter a real UK telephone number',
                    cy: 'Rhowch rif ffôn Prydeinig go iawn',
                }),
            },
        ];
    }
}

module.exports = PhoneField;
