'use strict';
const path = require('path');
const moment = require('moment');
const get = require('lodash/fp/get');

const { sendHtmlEmail } = require('../../../common/mail');
const { getAbsoluteUrl, localify } = require('../../../common/urls');
const { Users } = require('../../../db/models');

const { signTokenActivate } = require('./jwt');

module.exports = async function sendActivationEmail(req, user) {
    const locale = req.i18n.getLocale();
    const localise = get(locale);
    const now = moment();
    const { token, expiresAt } = signTokenActivate(user.id, now);

    function localisedAbsoluteUrl(urlPath) {
        return getAbsoluteUrl(req, localify(locale)(urlPath));
    }

    const mailParams = {
        name: 'user_activate_account',
        sendTo: user.username,
        subject: localise({
            en: 'Please confirm your email address',
            cy: 'Cadarnhewch eich cyfeiriad e-bost',
        }),
    };

    const email = await sendHtmlEmail(
        {
            template: path.resolve(
                __dirname,
                '../views/emails/activate-email.njk'
            ),
            templateData: {
                locale: locale,
                emailAddress: user.username,
                activationUrl: localisedAbsoluteUrl(
                    `/user/activate?token=${token}`
                ),
                loginUrl: localisedAbsoluteUrl(`/user/login`),
                expiryDate: expiresAt
                    .locale(locale)
                    .format('h:mma [on] dddd Do MMMM'),
            },
        },
        mailParams
    );

    await Users.updateDateOfActivationAttempt({
        id: user.id,
        dateOfActivationAttempt: now.unix(),
    });

    return {
        email: email,
        token: token,
        mailParams: mailParams,
    };
};
