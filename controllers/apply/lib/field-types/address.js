'use strict';
const compact = require('lodash/compact');
const Joi = require('../joi-extensions-next');

const Field = require('./field');

class AddressField extends Field {
    constructor(props) {
        super(props);

        this.type = 'address';

        this.isRequired = true;

        this.explanation = this.localise({
            en: `Enter the postcode and search for the address, or enter it manually below.`,
            cy: `Rhowch y cod post a chwiliwch am y cyfeiriad, neu ei deipio isod.`,
        });
    }

    defaultSchema() {
        return Joi.ukAddress().required();
    }

    defaultMessages() {
        return [
            {
                type: 'base',
                message: this.localise({
                    en: 'Enter a full UK address',
                    cy: 'Rhowch gyfeiriad Prydeinig llawn',
                }),
            },
            {
                type: 'any.empty',
                key: 'line1',
                message: this.localise({
                    en: 'Enter a building and street',
                    cy: 'Rhowch adeilad a stryd',
                }),
            },
            {
                type: 'string.max',
                key: 'line1',
                message: this.localise({
                    en: `Building and street must be 255 characters or less`,
                    cy: `Rhaid i’r adeilad a’r stryd fod yn llai na 255 nod`,
                }),
            },
            {
                type: 'string.max',
                key: 'line2',
                message: this.localise({
                    en: `Address line must be 255 characters or less`,
                    cy: `Rhaid i’r llinell cyfeiriad fod yn llai na 255 nod`,
                }),
            },
            {
                type: 'any.empty',
                key: 'townCity',
                message: this.localise({
                    en: 'Enter a town or city',
                    cy: 'Rhowch dref neu ddinas',
                }),
            },
            {
                type: 'string.max',
                key: 'townCity',
                message: this.localise({
                    en: `Town or city must be 40 characters or less`,
                    cy: `Rhaid i’r dref neu ddinas fod yn llai na 40 nod`,
                }),
            },
            {
                type: 'string.max',
                key: 'county',
                message: this.localise({
                    en: `County must be 80 characters or less`,
                    cy: `Rhaid i’r sir fod yn llai na 80 nod`,
                }),
            },
            {
                type: 'any.empty',
                key: 'postcode',
                message: this.localise({
                    en: 'Enter a postcode',
                    cy: 'Rhowch gôd post',
                }),
            },
            {
                type: 'string.postcode',
                key: 'postcode',
                message: this.localise({
                    en: 'Enter a real postcode',
                    cy: 'Rhowch gôd post go iawn',
                }),
            },
        ];
    }

    get displayValue() {
        if (this.value) {
            return compact(Object.values(this.value)).join(',\n');
        } else {
            return '';
        }
    }
}

module.exports = AddressField;
