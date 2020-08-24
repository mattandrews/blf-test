'use strict';
const moment = require('moment');
const Joi = require('../joi-extensions-next');

const Field = require('./field');

class DayMonthField extends Field {
    getType() {
        return 'day-month';
    }

    defaultSchema() {
        return Joi.dayMonth().required();
    }

    defaultMessages() {
        return [
            {
                type: 'base',
                message: this.localise({
                    en: 'Enter a day and month',
                    cy: 'Rhowch ddiwrnod a mis',
                }),
            },
            {
                type: 'any.invalid',
                message: this.localise({
                    en: 'Enter a real day and month',
                    cy: 'Rhowch ddiwrnod a mis go iawn',
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

module.exports = DayMonthField;
