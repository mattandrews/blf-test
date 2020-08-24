'use strict';
const get = require('lodash/fp/get');
const isFunction = require('lodash/isFunction');
const Joi = require('../joi-extensions-next');

class Field {
    constructor(props) {
        if (props.name) {
            this.name = props.name;
        } else {
            throw new Error('Must provide name');
        }

        if (props.locale) {
            this.locale = props.locale;
        } else {
            throw new Error('Must provide locale');
        }

        const label = props.label ? props.label : this.defaultLabel();
        if (label) {
            this.label = label;
        } else {
            throw new Error('Must provide label');
        }

        this.labelDetails = props.labelDetails;
        this.explanation = props.explanation;

        this.type = props.type ? props.type : this.getType();

        this.attributes = Object.assign(
            {},
            this.defaultAttributes(),
            props.attributes
        );

        this.settings = props.settings || {};

        this.isRequired = props.isRequired !== false;

        this._maxLength = props.maxLength || 255;

        this.schema = this.withCustomSchema(props.schema);

        this.suppliedMessages = props.messages;

        this.warnings = props.warnings || [];

        this.value = undefined;
        this.errors = [];
        this.featuredErrors = [];
    }

    getType() {
        return 'text';
    }

    /**
     * Allow sub-classes to provide a default label
     */
    defaultLabel() {
        return null;
    }

    withCustomSchema(customSchema) {
        if (customSchema) {
            return isFunction(customSchema)
                ? customSchema(this.defaultSchema())
                : customSchema;
        } else {
            return this.defaultSchema();
        }
    }

    /**
     * Allow sub-classes to provide a default schema
     * also allows it to be accessed by the instance
     */
    defaultSchema() {
        const baseSchema = Joi.string().max(this._maxLength);
        if (this.isRequired) {
            return baseSchema.required();
        } else {
            return baseSchema.allow('').optional();
        }
    }

    /**
     * Allow sub-classes to provide default messages
     */
    defaultMessages() {
        return [];
    }

    get messages() {
        const allMessages = this.defaultMessages().concat(
            this.suppliedMessages || []
        );

        if (
            this.isRequired &&
            allMessages.some((message) => message.type === 'base') === false
        ) {
            throw new Error(
                'Required fields must provide a base error message'
            );
        }

        return allMessages;
    }

    /**
     * Allow sub-classes to provide default attributes
     */
    defaultAttributes() {
        return { size: 40 };
    }

    localise(msg) {
        return get(this.locale)(msg);
    }

    withValue(value) {
        this.value = value;
        return this;
    }

    withErrors(errors) {
        this.errors = errors;
        return this;
    }

    withFeaturedErrors(featuredErrors) {
        this.featuredErrors = featuredErrors;
        return this;
    }

    validate() {
        return this.schema.validate(this.value);
    }

    get displayValue() {
        if (this.value) {
            return this.value.toString();
        } else {
            return '';
        }
    }
}

module.exports = Field;
