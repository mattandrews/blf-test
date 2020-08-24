'use strict';
const has = require('lodash/has');
const countWords = require('../count-words');
const Joi = require('../joi-extensions-next');

const Field = require('./field');

class TextareaField extends Field {
    constructor(props) {
        super(props);

        this.labelDetails = props.labelDetails;

        if (has(props, 'minWords') && has(props, 'maxWords')) {
            this.minWords = props.minWords;
            this.maxWords = props.maxWords;
        } else {
            throw new Error('Must provide minWords and maxWords');
        }

        this.settings = {
            stackedSummary: true,
            showWordCount: true,
            minWords: this.minWords,
            maxWords: this.maxWords,
        };

        const baseSchema = Joi.string()
            .minWords(this.minWords)
            .maxWords(this.maxWords);

        this.schema = this.isRequired
            ? baseSchema.required()
            : baseSchema.allow('').optional();
    }

    defaultMessages() {
        return [
            {
                type: 'string.minWords',
                message: this.localise({
                    en: `Answer must be at least ${this.minWords} words`,
                    cy: `Rhaid i’r ateb fod yn o leiaf ${this.minWords} gair`,
                }),
            },
            {
                type: 'string.maxWords',
                message: this.localise({
                    en: `Answer must be no more than ${this.maxWords} words`,
                    cy: `Rhaid i’r ateb fod yn llai na ${this.maxWords} gair`,
                }),
            },
        ];
    }

    getType() {
        return 'textarea';
    }

    defaultAttributes() {
        return { rows: 15 };
    }

    get displayValue() {
        if (this.value) {
            const val = this.value.toString();
            const wordCountSummary = `${countWords(val)}/${
                this.maxWords
            } ${this.localise({ en: 'words', cy: 'gair' })}`;

            return `${val}\n\n${wordCountSummary}`;
        } else {
            return '';
        }
    }
}

module.exports = TextareaField;
