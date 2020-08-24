'use strict';
const { isValid: postcodeIsValid } = require('postcode');

/**
 * Joi wrapper around https://github.com/ideal-postcodes/postcode
 */
module.exports = function postcodeString(joi) {
    return {
        type: 'string',
        base: joi.string().trim(),
        messages: {
            'string.postcode': 'did not seem to be a valid postcode',
        },
        rules: {
            postcode: {
                method() {
                    return this.$_addRule('postcode');
                },
                validate(value, helpers) {
                    if (postcodeIsValid(value)) {
                        return value;
                    } else {
                        return helpers.error('string.postcode');
                    }
                },
            },
        },
    };
};
