'use strict';
const find = require('lodash/fp/find');
const uniq = require('lodash/uniq');
const castArray = require('lodash/castArray');
const Joi = require('../joi-extensions-next');

const Field = require('./field');

class RadioField extends Field {
    constructor(props) {
        super(props);

        const options = props.options || [];
        if (options.length === 0) {
            throw Error('Must provide options');
        }

        const values = options.map((option) => option.value);
        if (values.length !== uniq(values).length) {
            throw new Error('Options must contain unique values');
        }

        this.options = options;
        this.schema = this.withCustomSchema(props.schema);
    }

    getType() {
        return 'radio';
    }

    defaultSchema() {
        const options = this.options || [];
        const baseSchema = Joi.string().valid(
            ...options.map((option) => option.value)
        );

        return this.isRequired ? baseSchema.required() : baseSchema.optional();
    }

    get displayValue() {
        if (this.value) {
            const choices = castArray(this.value);
            const match = find((option) => option.value === choices[0])(
                this.options
            );
            return match ? match.label : '';
        } else {
            return '';
        }
    }
}

module.exports = RadioField;
