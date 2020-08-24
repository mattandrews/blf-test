'use strict';
const moment = require('moment');
const Joi = require('../joi-extensions-next');

const Field = require('./field');

class MonthYearField extends Field {
    exampleYear() {
        return moment().subtract('5', 'years').format('YYYY');
    }

    getType() {
        return 'month-year';
    }

    defaultSchema() {
        return Joi.monthYear().pastDate().required();
    }

    defaultMessages() {
        return [
            {
                type: 'base',
                message: this.localise({
                    en: 'Enter a month and year',
                    cy: 'Rhowch fis a blwyddyn',
                }),
            },
            {
                type: 'any.invalid',
                message: this.localise({
                    en: 'Enter a real month and year',
                    cy: 'Rhowch fis a blwyddyn go iawn',
                }),
            },
            {
                type: 'number.min',
                key: 'year',
                message: this.localise({
                    en: `Must be a full year e.g. ${this.exampleYear()}`,
                    cy: `Rhaid bod yn flwyddyn gyfan e.e ${this.exampleYear()}`,
                }),
            },
            {
                type: 'monthYear.pastDate',
                message: this.localise({
                    en: 'Date you enter must be in the past',
                    cy: 'Rhaid i’r dyddiad fod yn y gorffennol',
                }),
            },
        ];
    }

    get displayValue() {
        if (this.value) {
            const dt = moment({
                year: moment().year(),
                month: this.value.month - 1,
                day: this.value.day,
            });

            return dt.isValid() ? dt.locale(this.locale).format('Do MMMM') : '';
        } else {
            return '';
        }
    }
}

module.exports = MonthYearField;
