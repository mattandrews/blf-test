'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const isEmpty = require('lodash/isEmpty');

const { localify } = require('../../../common/urls');
const { noStore } = require('../../../common/cached');
const { requireActiveUser } = require('../../../common/authed');
const {
    PendingApplication,
    SubmittedApplication,
} = require('../../../db/models');
const logger = require('../../../common/logger').child({ service: 'apply' });

const enrichAwardsForAll = require('../under10k/enrich');
const enrichStandard = require('../standard-proposal/enrich');
const { getNoticesAll } = require('../lib/notices');

const router = express.Router();

function enrichPending(application, locale) {
    if (application.formId === 'awards-for-all') {
        return enrichAwardsForAll.enrichPending(application, locale);
    } else {
        return enrichStandard.enrichPending(application, locale);
    }
}

function enrichSubmitted(application, locale) {
    if (application.formId === 'awards-for-all') {
        return enrichAwardsForAll.enrichSubmitted(application, locale);
    } else {
        return enrichStandard.enrichSubmitted(application, locale);
    }
}

/**
 * Determine the latest application to show and
 * prepare application data for display in the view.
 */
async function getLatestApplication(userId, locale) {
    const [pending, submitted] = await Promise.all([
        PendingApplication.findLatestByUserId(userId),
        SubmittedApplication.findLatestByUserId(userId),
    ]);

    if (pending && submitted) {
        if (moment(pending.updatedAt).isAfter(submitted.updatedAt)) {
            return enrichPending(pending, locale);
        } else {
            return enrichSubmitted(submitted, locale);
        }
    } else if (submitted) {
        return enrichSubmitted(submitted, locale);
    } else if (pending) {
        return enrichPending(pending, locale);
    }
}

function injectNavigationLinks(req, res, next) {
    res.locals.userNavigationLinks = [
        {
            url: req.baseUrl,
            label: req.i18n.__('apply.navigation.latestApplication'),
        },
        {
            url: `${req.baseUrl}/all`,
            label: req.i18n.__('apply.navigation.allApplications'),
        },
        {
            url: `${req.baseUrl}/submitted`,
            label: req.i18n.__('apply.navigation.submittedApplications'),
        },
        {
            url: localify(req.i18n.getLocale())('/user'),
            label: req.i18n.__('apply.navigation.account'),
        },
    ];

    next();
}

router.get(
    '/',
    noStore,
    requireActiveUser,
    injectNavigationLinks,
    async function (req, res, next) {
        const copy = req.i18n.__('apply.dashboard');

        try {
            /**
             * Check for existing pending applications
             * Used to determine if "start a new application" action card
             * is in a primary or secondary style.
             * Secondary if we have a pending application for the product
             */
            const [
                latestApplication,
                pendingSimple,
                pendingStandard,
            ] = await Promise.all([
                getLatestApplication(req.user.id, req.i18n.getLocale()),
                PendingApplication.findUserApplicationsByForm({
                    userId: req.user.id,
                    formId: 'awards-for-all',
                }),
                PendingApplication.findUserApplicationsByForm({
                    userId: req.user.id,
                    formId: 'standard-enquiry',
                }),
            ]);

            const notices = getNoticesAll(req.i18n.getLocale(), pendingSimple);
            if (notices.length > 0) {
                logger.info('Notice shown on dashboard');
            }

            res.render(path.resolve(__dirname, './views/dashboard'), {
                copy: copy,
                title: copy.latest.title,
                notices: notices,
                latestApplication: latestApplication,
                hasPendingSimpleApplication: !isEmpty(pendingSimple),
                hasPendingStandardApplication: !isEmpty(pendingStandard),
            });
        } catch (err) {
            next(err);
        }
    }
);

router.get(
    '/all',
    noStore,
    requireActiveUser,
    injectNavigationLinks,
    async function (req, res, next) {
        const copy = req.i18n.__('apply.dashboard');

        try {
            const [
                pendingApplications,
                submittedApplications,
            ] = await Promise.all([
                PendingApplication.findAllByUserId(req.user.id),
                SubmittedApplication.findAllByUserId(req.user.id),
            ]);

            if (req.query.s === 'applicationDeleted') {
                res.locals.alertMessage = copy.applicationDeleted;
                res.locals.hotJarTagList = ['User deleted an application'];
            }

            const notices = getNoticesAll(
                req.i18n.getLocale(),
                pendingApplications
            );

            if (notices.length > 0) {
                logger.info('Notice shown on all applications dashboard');
            }

            res.render(path.resolve(__dirname, './views/dashboard-all'), {
                copy: copy,
                title: copy.all.title,
                notices: notices,
                pendingApplications: pendingApplications.map((application) =>
                    enrichPending(application, req.i18n.getLocale())
                ),
                submittedApplications: submittedApplications.map(
                    (application) =>
                        enrichSubmitted(application, req.i18n.getLocale())
                ),
            });
        } catch (err) {
            next(err);
        }
    }
);

router.get(
    '/submitted',
    noStore,
    requireActiveUser,
    injectNavigationLinks,
    async function (req, res, next) {
        const copy = req.i18n.__('apply.dashboard');

        try {
            const [
                submittedApplications,
            ] = await Promise.all([
                SubmittedApplication.findAllByUserId(req.user.id),
            ]);

            if (req.query.s === 'applicationDeleted') {
                res.locals.alertMessage = copy.applicationDeleted;
                res.locals.hotJarTagList = ['User deleted an application'];
            }

            res.render(path.resolve(__dirname, './views/submitted'), {
                copy: copy,
                title: copy.submitted.title,
                submittedApplications: submittedApplications.map(
                    (application) =>
                        enrichSubmitted(application, req.i18n.getLocale())
                ),
            });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
