'use strict';
const castArray = require('lodash/castArray');
const uniq = require('lodash/uniq');
const Joi = require('../joi-extensions-next');

const Field = require('./field');

class CheckboxField extends Field {
    constructor(props) {
        super(props);

        this.type = 'checkbox';

        const options = props.options || [];
        const optgroups = props.optgroups || [];

        const optionMode =
            props.options && !props.optgroups ? 'options' : 'optgroups';

        if (options.length === 0 && optgroups.length === 0) {
            throw new Error('Must provide either options or optgroups');
        }

        if (optionMode === 'options' && options.length === 0) {
            throw new Error('Must provide some options');
        }

        if (optionMode === 'optgroups' && optgroups.length === 0) {
            throw new Error('Must provide some optgroups');
        }

        if (optionMode === 'options') {
            this.options = options;
        } else {
            this.optgroups = optgroups;
        }

        const values = this.normalisedOptions.map((option) => option.value);
        if (values.length !== uniq(values).length) {
            throw new Error('Options must contain unique values');
        }
        this.schema = this.withCustomSchema(props.schema);
    }

    get normalisedOptions() {
        const optgroups = this.optgroups || [];
        const options = this.options || [];
        return optgroups.length > 0
            ? optgroups.flatMap((group) => group.options)
            : options;
    }

    defaultSchema() {
        const baseSchema = Joi.array()
            .items(
                Joi.string().valid(
                    ...this.normalisedOptions.map((option) => option.value)
                )
            )
            .single();

        if (this.isRequired) {
            return baseSchema.required();
        } else {
            return baseSchema.optional();
        }
    }

    get displayValue() {
        if (this.value) {
            return this.normalisedOptions
                .filter((option) =>
                    castArray(this.value).includes(option.value)
                )
                .map((match) => match.label)
                .join(',\n');
        } else {
            return '';
        }
    }
}

module.exports = CheckboxField;
