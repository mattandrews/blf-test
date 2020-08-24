'use strict';
const fromDateParts = require('./from-date-parts');

function formatDateRange(locale) {
    return function (value) {
        if (!value.startDate || !value.endDate) {
            return '';
        } else {
            const startDate = fromDateParts(value.startDate);
            const endDate = fromDateParts(value.endDate);

            if (!startDate.isValid() || !endDate.isValid()) {
                return '';
            } else {
                return `${startDate
                    .locale(locale)
                    .format('D MMMM, YYYY')}–${endDate
                    .locale(locale)
                    .format('D MMMM, YYYY')}`;
            }
        }
    };
}

module.exports = {
    formatDateRange,
};
