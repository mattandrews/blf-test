'use strict';
const Joi = require('../joi-extensions-next');
const fromDateParts = require('../from-date-parts');

const Field = require('./field');

class DateField extends Field {
    getType() {
        return 'date';
    }

    defaultSchema() {
        return Joi.dateParts().required();
    }

    defaultMessages() {
        return [
            {
                type: 'any.invalid',
                message: this.localise({
                    en: 'Enter a real date',
                    cy: 'Rhowch ddyddiad go iawn',
                }),
            },
        ];
    }

    get displayValue() {
        if (this.value) {
            const dt = fromDateParts(this.value);
            return dt.isValid()
                ? dt.locale(this.locale).format('D MMMM, YYYY')
                : '';
        } else {
            return '';
        }
    }
}

module.exports = DateField;
