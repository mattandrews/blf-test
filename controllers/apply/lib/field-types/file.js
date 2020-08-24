'use strict';
const compact = require('lodash/compact');
const mime = require('mime-types');
const fileSize = require('filesize');

const Field = require('./field');
const Joi = require('../joi-extensions-next');

class FileField extends Field {
    constructor(props) {
        super(props);

        this.labelExisting = props.labelExisting || null;

        this.maxFileSize = {
            value: 12 * 1048576,
            label: '12MB',
        };

        this.supportedFileTypes = [
            { mime: 'image/png', label: 'PNG' },
            { mime: 'image/jpeg', label: 'JPEG' },
            { mime: 'application/pdf', label: 'PDF' },
        ];

        this.supportedMimeTypes = this.supportedFileTypes.map(
            (type) => type.mime
        );

        this.attributes = Object.assign(
            {},
            { accept: this.supportedMimeTypes.join(',') },
            props.attributes
        );

        this.isRequired = true;

        this.schema = Joi.object({
            filename: Joi.string().required(),
            size: Joi.number().max(this.maxFileSize.value).required(),
            type: Joi.string()
                .valid(...this.supportedMimeTypes)
                .required(),
        }).required();
    }

    defaultMessages() {
        const typeList = this.supportedFileTypes
            .map((type) => type.label)
            .join(', ');
        return [
            {
                type: 'any.allowOnly',
                message: this.localise({
                    en: `Please upload a file in one of these formats: ${typeList}`,
                    cy: `Uwch lwythwch ffeil yn un o’r fformatiau hyn: ${typeList}`,
                }),
            },
            {
                type: 'number.max',
                message: this.localise({
                    en: `Please upload a file below ${this.maxFileSize.label}`,
                    cy: `Uwch lwythwch ffeil isod ${this.maxFileSize.label}`,
                }),
            },
        ];
    }

    getType() {
        return 'file';
    }

    get displayValue() {
        if (this.value) {
            const mimeType = mime.extension(this.value.type);
            const formatted = fileSize(this.value.size, { round: 0 });
            return `${this.value.filename} (${compact([
                mimeType && mimeType.toUpperCase(),
                formatted,
            ]).join(', ')})`;
        } else {
            return '';
        }
    }
}

module.exports = FileField;
