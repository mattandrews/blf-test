'use strict';
const express = require('express');
const passport = require('passport');
const path = require('path');
const Sentry = require('@sentry/node');

const { Users } = require('../../db/models');
const { localify } = require('../../common/urls');
const { sanitise } = require('../../common/sanitise');
const logger = require('../../common/logger').child({ service: 'user' });
const { csrfProtection } = require('../../common/cached');
const {
    requireNoAuth,
    redirectUrlWithFallback,
} = require('../../common/authed');

const validateSchema = require('../../common/validate-schema');
const { newAccounts } = require('./lib/account-schemas');
const sendActivationEmail = require('./lib/activation-email');

const router = express.Router();

function logIn(req, res, next) {
    passport.authenticate('local', function (authError, authUser) {
        if (authError) {
            next(authError);
        } else {
            req.logIn(authUser, function (loginErr) {
                res.locals.setAuthCookie();
                if (loginErr) {
                    next(loginErr);
                } else {
                    redirectUrlWithFallback(req, res, '/user?s=activationSent');
                }
            });
        }
    })(req, res, next);
}

function renderForm(req, res, data = null, errors = []) {
    res.render(path.resolve(__dirname, './views/register'), {
        title: req.i18n.__('user.register.title'),
        csrfToken: req.csrfToken(),
        formValues: data,
        errors: errors,
    });
}

router
    .route('/')
    .all(requireNoAuth, csrfProtection)
    .get(renderForm)
    .post(async function handleRegister(req, res, next) {
        const validationResult = validateSchema(
            newAccounts(req.i18n),
            req.body
        );

        /**
         * Fallback error
         * Shown when there is an error authenticating or attempting to register with an existing user
         * This messages needs to be generic to avoid exposing the account state.
         */
        const fallbackErrors = [
            {
                msg: req.i18n.__(
                    'user.register.genericError',
                    localify(req.i18n.getLocale())('/user/password/forgot')
                ),
            },
        ];

        if (validationResult.isValid) {
            try {
                const { username, password } = validationResult.value;
                // check if this email address already exists
                // we can't use findOrCreate here because the password changes
                // each time we hash it, which sequelize sees as a new user
                const existingUser = await Users.findByUsername(username);

                if (existingUser) {
                    logger.info('Account already exists');

                    renderForm(
                        req,
                        res,
                        validationResult.value,
                        fallbackErrors
                    );
                } else {
                    const newUser = await Users.createUser({
                        username: sanitise(username),
                        password: password,
                    });

                    // Success! now send them an activation email
                    const activationData = await sendActivationEmail(
                        req,
                        newUser
                    );

                    logger.info('Registration successful');

                    if (req.body.returnToken) {
                        // used for tests to verify activation works
                        res.send(activationData);
                    } else {
                        logIn(req, res, next);
                    }
                }
            } catch (error) {
                logger.warn('Registration failed', error);
                Sentry.captureException(error);
                renderForm(req, res, validationResult.value, fallbackErrors);
            }
        } else {
            /**
             * Log validation errors
             */
            if (validationResult.messages.length > 0) {
                const hasPasswordIssue = validationResult.messages.some(
                    (_) => _.param === 'password'
                );

                if (hasPasswordIssue) {
                    res.locals.hotJarTagList = [
                        'User: Error on password creation',
                    ];
                }

                validationResult.messages.forEach((item) => {
                    logger.info(item.msg, { type: item.type });
                });
            }

            renderForm(
                req,
                res,
                validationResult.value,
                validationResult.messages
            );
        }
    });

module.exports = router;
