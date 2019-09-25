'use strict';
const castArray = require('lodash/castArray');
const filter = require('lodash/filter');
const includes = require('lodash/includes');
const Joi = require('../joi-extensions');

const Field = require('./field');

class CheckboxField extends Field {
    constructor(props, locale) {
        super(props, locale);

        this.type = 'checkbox';

        const options = props.options || [];
        if (options.length === 0) {
            throw new Error('Must provide options');
        }

        this.options = options;

        this.schema = props.schema ? props.schema : this.defaultSchema();
    }

    defaultSchema() {
        const options = this.options || [];
        const baseSchema = Joi.array()
            .items(Joi.string().valid(options.map(option => option.value)))
            .single();

        if (this.isRequired) {
            return baseSchema.required();
        } else {
            return baseSchema.optional();
        }
    }

    get displayValue() {
        if (this.value) {
            const choices = castArray(this.value);

            const matches = filter(this.options, option =>
                includes(choices, option.value)
            );

            return matches.length > 0
                ? matches.map(match => match.label).join(',\n')
                : choices.join(',\n');
        } else {
            return '';
        }
    }
}

module.exports = CheckboxField;
