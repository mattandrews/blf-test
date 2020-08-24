'use strict';
const fs = require('fs');
const path = require('path');
const config = require('config');
const moment = require('moment-timezone');
const isString = require('lodash/isString');
const get = require('lodash/get');
const { SALESFORCE_SANDBOX_DOMAIN } = require('../common/secrets');

const appData = require('./appData');
const { getAbsoluteUrl, getCurrentUrl, isWelsh, localify } = require('./urls');

let assets = {};
try {
    assets = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../config/assets.json'), 'utf8')
    );
} catch (e) {} // eslint-disable-line no-empty

/**
 * Set request locals
 * - Local properties that depend on the request
 * - Local methods for use in views that depend on the request
 */
module.exports = function (req, res, next) {
    /**
     * Set current locale
     */
    if (isWelsh(req.url)) {
        req.i18n.setLocale('cy');
        res.setHeader('Content-Language', 'cy');
    }

    const locale = req.i18n.getLocale();

    /**
     * Store locale state as request locals.
     */
    res.locals.locale = locale;
    res.locals.localePrefix = isWelsh(req.url) ? '/welsh' : '';

    /**
     * Environment metadata
     */
    res.locals.appData = appData;

    /**
     * Assets version, used for cache-busting static assets
     */
    res.locals.ASSETS_VERSION = assets.version || 'latest';

    /**
     * Is this page bilingual?
     * i.e. do we have a Welsh translation
     * Default to true unless overridden by a route
     */
    res.locals.isBilingual = true;

    /**
     * Feature flags
     */
    res.locals.enableSiteSurvey = true;
    res.locals.hotjarId = config.get('hotjarId');

    /**
     * Show COVID-19 announcement banner?
     * Default to true, allow overriding on specific pages
     */
    res.locals.showCOVID19AnnouncementBanner = true;

    /**
     * Global copy
     */
    res.locals.globalCopy = {
        brand: req.i18n.__('global.brand'),
    };

    /**
     * Global navigation model
     */
    const navCopy = req.i18n.__('global.nav');
    res.locals.globalNavigation = {
        home: {
            label: navCopy.home,
            url: localify(locale)('/'),
        },
        login: {
            label: navCopy.logIn,
            url: localify(locale)('/user/login'),
        },
        logout: {
            label: navCopy.logOut,
            url: localify(locale)('/user/logout'),
        },
        myApplications: {
            label: navCopy.myApplications,
            url: localify(locale)('/apply'),
        },
        primaryLinks: [
            { label: navCopy.funding, url: localify(locale)('/funding') },
            { label: navCopy.updates, url: localify(locale)('/news') },
            { label: navCopy.insights, url: localify(locale)('/insights') },
            { label: navCopy.contact, url: localify(locale)('/contact') },
        ],
        secondaryLinks: [
            { label: navCopy.about, url: localify(locale)('/about') },
            { label: navCopy.jobs, url: localify(locale)('/jobs') },
        ],
    };

    /**
     * Fallback hero image
     * Used where there is no image but a hard requirement
     * for the layout and the main image fails to load
     */
    res.locals.fallbackHeroImage = {
        small: '/assets/images/hero/fallback-hero-small.jpg',
        medium: '/assets/images/hero/fallback-hero-medium.jpg',
        large: '/assets/images/hero/fallback-hero-large.jpg',
        default: '/assets/images/hero/fallback-hero-medium.jpg',
        caption: 'The Outdoor Partnership',
    };

    res.locals.getSocialImageUrl = function (socialImage) {
        if (isString(socialImage)) {
            return socialImage.indexOf('://') !== -1
                ? socialImage
                : getAbsoluteUrl(socialImage);
        } else {
            return getAbsoluteUrl(req, socialImage.default);
        }
    };

    /**
     * Get normalised page title for metadata
     */
    res.locals.getMetaTitle = function (base, pageTitle) {
        return pageTitle ? `${pageTitle} | ${base}` : base;
    };

    /**
     * Current path without query string
     */
    res.locals.currentPath = req.path;

    /**
     * Absolute URL helper
     */
    res.locals.getAbsoluteUrl = function (urlPath) {
        return getAbsoluteUrl(req, urlPath);
    };

    /**
     * Current URL helper
     * (Returns just the path)
     */
    res.locals.getCurrentUrl = function (requestedLocale) {
        return getCurrentUrl(req, requestedLocale);
    };

    /**
     * Current absolute URL helper
     * (Returns the absolute URL including protocol/base)
     */
    res.locals.getCurrentAbsoluteUrl = function (requestedLocale) {
        return getAbsoluteUrl(req, getCurrentUrl(req, requestedLocale));
    };

    /**
     * View helper for outputting a path in the current locale
     */
    res.locals.localify = function (urlPath) {
        return localify(req.i18n.getLocale())(urlPath);
    };

    /**
     * View helper for formatting date string in ISO format

     * @param {String} dateString
     * @return {String}
     * @param dateString
     */
    res.locals.formatISODate = function (dateString) {
        return moment(dateString).toISOString(true);
    };

    /**
     * View helper for formatting date in the current locale
     * @see https://momentjs.com/docs/#/displaying/format/
     *
     * @param {String} dateString
     * @param {String} format
     * @return {String}
     */
    res.locals.formatDate = function (dateString, format = 'D MMMM, YYYY') {
        return moment(dateString).locale(locale).format(format);
    };

    /**
     * View helper for formatting date in relative calendar time format
     * @see https://momentjs.com/docs/#/displaying/calendar-time/
     *
     * @param {String} dateString
     * @return {String}
     * @param dateString
     */
    res.locals.formatCalendarTime = function (dateString) {
        return moment(dateString)
            .tz('Europe/London')
            .locale(locale === 'en' ? 'en-gb' : 'cy')
            .calendar(null, {
                sameElse: 'D MMMM, YYYY',
            });
    };

    /**
     * View helper to represent date as relative time
     * @param {String} dateString
     */
    res.locals.timeFromNow = function (dateString) {
        return moment(dateString).locale(locale).fromNow();
    };

    /**
     * Helper functions to set/unset auth cookie flags
     */

    const authCookieOptions = {
        secure: !appData.isDev,
        maxAge: config.get('session.expiryInSeconds') * 1000,
    };

    res.locals.setAuthCookie = function () {
        res.cookie(
            config.get('session.cookieLogin'),
            'logged-in',
            authCookieOptions
        );
    };

    res.locals.clearAuthCookie = function () {
        res.clearCookie(config.get('session.cookieLogin'), authCookieOptions);
    };

    /**
     * Mark the request as a sandbox user if accessed by staff with this option enabled
     * (eg. to use the Sandbox CMS for staff training)
     */
    res.locals.cmsFlags = {};
    if (get(req, 'user.userData.is_sandbox')) {
        res.locals.cmsFlags.sandboxMode = true;
    }

    /**
     * Check the domain to point to the correct Salesforce Endpint (sandbox)
     * */
    if (get(req, 'hostname') === SALESFORCE_SANDBOX_DOMAIN) {
        res.locals.USE_GMS_SANDBOX = true;
    }

    next();
};
