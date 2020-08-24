'use strict';
const { isValid: postcodeIsValid } = require('postcode');

/**
 * Joi wrapper around https://github.com/ideal-postcodes/postcode
 */
module.exports = function postcodeString(joi) {
    return {
        base: joi.string().trim(),
        name: 'string',
        language: {
            postcode: 'did not seem to be a valid postcode',
        },
        rules: [
            {
                name: 'postcode',
                validate(_params, value, state, options) {
                    if (postcodeIsValid(value)) {
                        return value;
                    } else {
                        return this.createError(
                            'string.postcode',
                            { value },
                            state,
                            options
                        );
                    }
                },
            },
        ],
    };
};
