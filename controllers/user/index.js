'use strict';
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');

const { Users } = require('../../db/models');
const { isDev } = require('../../common/appData');
const { localify } = require('../../common/urls');
const { noStore } = require('../../common/cached');
const { requireNotStaffAuth } = require('../../common/authed');
const logger = require('../../common/logger');

const router = express.Router();

router.use(noStore);

/**
 * Staff auth
 * Azure Active Directory authentication for staff members
 */
router.use('/staff', require('./staff'));

/**
 * User seed endpoint
 * Allows generation of seed users in test environments
 * Seed users have isActive automatically set as true
 * to bypass activation flow in tests.
 */
if (isDev) {
    router.post('/seed', (req, res) => {
        const username = `${uuidv4()}@example.com`;
        const password = uuidv4();

        Users.createUser({
            username: username,
            password: password,
            isActive: true,
        }).then((newUser) => {
            res.json({ username, password, id: newUser.id });
        });
    });
}

/**
 * Session check endpoint
 *
 * Used in AJAX calls to determine the user's logged-in state.
 * Must appear here (eg. before we require non-staff users)
 */
router.get('/session', function (req, res) {
    req.session.touch();
    req.session.save(() => {
        const locale = req.i18n.getLocale();
        const sessionExpiresOn = moment().add(
            req.session.cookie.maxAge / 1000,
            'seconds'
        );
        res.send({
            expiresOn: {
                time: sessionExpiresOn.locale(locale).format('h:mma'),
                date: sessionExpiresOn
                    .locale(locale)
                    .format('dddd D MMMM YYYY'),
            },
            maxAge: req.session.cookie.maxAge,
            isAuthenticated: req.isAuthenticated(),
            userType: req.user ? req.user.userType : null,
        });
    });
});

/**
 * Public user routes
 * Disallow staff from this point on
 */
router.use(requireNotStaffAuth, function (req, res, next) {
    res.locals.bodyClass = 'has-static-header'; // No hero images on user pages
    res.locals.sectionTitle = req.i18n.__('user.common.yourAccount');
    res.locals.sectionUrl = req.baseUrl;

    if (req.user) {
        res.locals.user = req.user;

        const localeUrl = localify(req.i18n.getLocale());
        res.locals.userNavigationLinks = [
            {
                url: localeUrl('/apply'),
                label: req.i18n.__('apply.navigation.latestApplication'),
            },
            {
                url: localeUrl('/apply/all'),
                label: req.i18n.__('apply.navigation.allApplications'),
            },
            {
                url: `${req.baseUrl}/submitted`,
                label: req.i18n.__('apply.navigation.submittedApplications'),
            },
            {
                url: req.baseUrl,
                label: req.i18n.__('apply.navigation.account'),
            },
        ];
    }

    next();
});

router.use('/', require('./dashboard'));
router.use('/login', require('./login'));
router.use('/register', require('./register'));
router.use('/activate', require('./activate'));
router.use('/password', require('./password'));
router.use('/update-email', require('./update-email'));

router.get('/logout', function (req, res) {
    req.logout();
    res.locals.clearAuthCookie();
    logger.info('User logout', { service: 'user' });
    req.session.save(() => {
        res.redirect(localify(req.i18n.getLocale())('/user/login?s=loggedOut'));
    });
});

module.exports = router;
