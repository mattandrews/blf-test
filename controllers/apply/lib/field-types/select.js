'use strict';
const uniq = require('lodash/uniq');
const Joi = require('../joi-extensions-next');

const Field = require('./field');

class SelectField extends Field {
    constructor(props) {
        super(props);

        this.optgroups = props.optgroups || [];
        this.options = props.options || [];

        if (this.optgroups.length > 0) {
            if (props.defaultOption) {
                this.defaultOption = props.defaultOption;
            } else {
                throw new Error(
                    'Must provide default option when using optgroups'
                );
            }
        }

        const values = this.normalisedOptions.map((option) => option.value);
        if (values.length !== uniq(values).length) {
            throw new Error('Options must contain unique values');
        }

        this.schema = this.withCustomSchema(props.schema);
    }

    getType() {
        return 'select';
    }

    get normalisedOptions() {
        const optgroups = this.optgroups || [];
        const options = this.options || [];
        return optgroups.length > 0
            ? optgroups.flatMap((group) => group.options)
            : options;
    }

    defaultSchema() {
        const baseSchema = Joi.string().valid(
            ...this.normalisedOptions.map((option) => option.value)
        );

        if (this.isRequired) {
            return baseSchema.required();
        } else {
            return baseSchema.optional();
        }
    }

    get displayValue() {
        if (this.value) {
            const match = this.normalisedOptions.find(
                (option) => option.value === this.value
            );
            return match ? match.label : '';
        } else {
            return '';
        }
    }
}

module.exports = SelectField;
