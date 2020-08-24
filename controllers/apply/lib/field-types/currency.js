'use strict';
const Joi = require('../joi-extensions-next');

const Field = require('./field');

class CurrencyField extends Field {
    constructor(props) {
        super(props);
        this.minAmount = props.minAmount;
        this.schema = this.withCustomSchema(props.schema);
    }

    getType() {
        return 'currency';
    }

    defaultSchema() {
        const minAmount = this.minAmount || 0;
        const maxAmount = this.maxAmount || 1000000000;
        const baseSchema = Joi.friendlyNumber()
            .integer()
            .min(minAmount)
            .max(maxAmount);

        if (this.isRequired) {
            return baseSchema.required();
        } else {
            return baseSchema.optional();
        }
    }

    get displayValue() {
        if (this.value) {
            return `£${this.value.toLocaleString()}`;
        } else {
            return '';
        }
    }
}

module.exports = CurrencyField;
