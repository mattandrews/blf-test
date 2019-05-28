'use strict';
const express = require('express');
const passport = require('passport');
const path = require('path');
const Sentry = require('@sentry/node');

const userService = require('../../services/user');
const { csrfProtection } = require('../../middleware/cached');
const { localify } = require('../../modules/urls');
const {
    injectCopy,
    injectBreadcrumbs
} = require('../../middleware/inject-content');
const {
    requireUnauthed,
    redirectUrlWithFallback
} = require('../../middleware/authed');

const normaliseErrors = require('./lib/normalise-errors');
const schema = require('./schema');
const { sendActivationEmail } = require('./helpers');

const router = express.Router();

function renderForm(req, res, data = null, errors = []) {
    res.render(path.resolve(__dirname, './views/register'), {
        csrfToken: req.csrfToken(),
        formValues: data,
        errors: errors
    });
}

router
    .route('/')
    .all(
        requireUnauthed,
        csrfProtection,
        injectCopy('user.register'),
        injectBreadcrumbs
    )
    .get(renderForm)
    .post(async function handleRegister(req, res, next) {
        const validationResult = schema.accountSchema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (validationResult.error) {
            const errors = normaliseErrors({
                errorDetails: validationResult.error.details,
                errorMessages: schema.errorMessages(req.i18n.getLocale())
            });

            renderForm(req, res, validationResult.value, errors);
        } else {
            try {
                const { username, password } = validationResult.value;
                // check if this email address already exists
                // we can't use findOrCreate here because the password changes
                // each time we hash it, which sequelize sees as a new user
                const existingUser = await userService.findByUsername(username);

                if (existingUser) {
                    throw new Error(
                        'A user tried to register with an existing email address'
                    );
                } else {
                    const newUser = await userService.createUser({
                        username: username,
                        password: password
                    });

                    // Success! now send them an activation email
                    const activationData = await sendActivationEmail(
                        req,
                        newUser
                    );

                    if (req.body.returnToken) {
                        // used for tests to verify activation works
                        res.send(activationData);
                    } else {
                        passport.authenticate('local', function(
                            authError,
                            authUser
                        ) {
                            if (authError) {
                                next(authError);
                            } else {
                                req.logIn(authUser, function(loginErr) {
                                    if (loginErr) {
                                        next(loginErr);
                                    } else {
                                        const fallbackUrl = localify(
                                            req.i18n.getLocale()
                                        )('/user?s=activationSent');

                                        redirectUrlWithFallback(
                                            fallbackUrl,
                                            req,
                                            res
                                        );
                                    }
                                });
                            }
                        })(req, res, next);
                    }
                }
            } catch (error) {
                Sentry.captureException(error);
                res.locals.alertMessage = `There was an error creating your account - please try again`;
                renderForm(req, res, validationResult.value);
            }
        }
    });

module.exports = router;
