'use strict';
const moment = require('moment');
const Joi = require('./joi-extensions');

function singleChoice(options) {
    return Joi.string().valid(options.map(option => option.value));
}

function multiChoice(options) {
    return Joi.array()
        .items(Joi.string().valid(options.map(option => option.value)))
        .single();
}

function futureDate({ amount = null, unit = null } = {}) {
    const minDate = amount && unit ? moment().add(amount, unit) : moment();
    return Joi.dateParts().futureDate(minDate.format('YYYY-MM-DD'));
}

function dateOfBirth(minAge) {
    return Joi.dateParts().dob(minAge);
}

function budgetItems(maxBudget) {
    return Joi.budgetItems()
        .maxBudget(maxBudget)
        .required();
}

/**
 * @see https://github.com/chriso/validator.js/blob/master/lib/isPostalCode.js#L54
 */
function postcode() {
    return Joi.string()
        .trim()
        .regex(
            new RegExp(
                '(gir\\s?0aa|[a-zA-Z]{1,2}\\d[\\da-zA-Z]?\\s?(\\d[a-zA-Z]{2})?)',
                'i'
            )
        );
}

function ukAddress() {
    return Joi.object({
        'building-street': Joi.string().required(),
        'town-city': Joi.string().required(),
        'county': Joi.string()
            .allow('')
            .optional(),
        'postcode': postcode().required()
    });
}

function ukPhoneNumber() {
    return Joi.string().phoneNumber({
        defaultCountry: 'GB',
        format: 'national'
    });
}

module.exports = {
    Joi,
    budgetItems,
    dateOfBirth,
    futureDate,
    multiChoice,
    postcode,
    singleChoice,
    ukAddress,
    ukPhoneNumber
};
