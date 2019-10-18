'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const isEmpty = require('lodash/isEmpty');
const sumBy = require('lodash/sumBy');

const { csrfProtection } = require('../../common/cached');
const { requireActiveUser } = require('../../common/authed');
const { injectCopy } = require('../../common/inject-content');
const { PendingApplication, SubmittedApplication } = require('../../db/models');
const { formatDateRange } = require('./lib/formatters');

const awardsForAllFormBuilder = require('./awards-for-all/form');
const getAdviceFormBuilder = require('./get-advice/form');

const router = express.Router();

function formBuilderFor(formId) {
    return formId === 'standard-enquiry'
        ? getAdviceFormBuilder
        : awardsForAllFormBuilder;
}

function enrichPendingApplication(application, locale) {
    const data = application.applicationData;
    const form = formBuilderFor(application.formId)({ locale, data });
    const localise = get(locale);

    if (application.formId === 'standard-enquiry') {
        return {
            type: 'pending',
            id: application.id,
            formId: application.formId,
            projectName: getOr(
                localise({ en: 'Untitled proposal', cy: '' }),
                'projectName'
            )(data),
            amountRequested: `£${data.projectCosts.toLocaleString()}`,
            overview: [
                {
                    label: 'Project length',
                    value: `${data.projectDurationYears} years`
                },
                {
                    label: 'Location',
                    value: data.projectLocation
                },
                {
                    label: 'Organisation',
                    value:
                        data.organisationTradingName ||
                        data.organisationLegalName
                }
            ],
            progress: form.progress,
            expiresAt: application.expiresAt,
            updatedAt: application.updatedAt
        };
    } else {
        return {
            type: 'pending',
            id: application.id,
            formId: application.formId,
            projectName: getOr(
                localise({ en: 'Untitled application', cy: 'Cais heb deitl' }),
                'projectName'
            )(data),
            amountRequested: `£${sumBy(
                getOr([], 'projectBudget', data),
                item => parseInt(item.cost, 10) || 0
            ).toLocaleString()}`,
            overview: [
                {
                    label: 'Project dates',
                    value: formatDateRange(locale)(data.projectDateRange)
                },
                {
                    label: 'Location',
                    value: data.projectLocation
                },
                {
                    label: 'Organisation',
                    value:
                        data.organisationTradingName ||
                        data.organisationLegalName
                }
            ],
            progress: form.progress,
            expiresAt: application.expiresAt,
            updatedAt: application.updatedAt
        };
    }
}

function enrichSubmittedApplication(application) {
    const data = application.salesforceSubmission.application;

    if (application.formId === 'standard-enquiry') {
        return {
            type: 'submitted',
            id: application.id,
            formId: application.formId,
            projectName: data.projectName,
            amountRequested: `£${data.projectCosts.toLocaleString()}`,
            overview: [
                {
                    label: 'Project length',
                    value: `${data.projectDurationYears} years`
                },
                {
                    label: 'Location',
                    value: data.projectLocation
                },
                {
                    label: 'Organisation',
                    value:
                        data.organisationTradingName ||
                        data.organisationLegalName
                }
            ],
            submittedAt: application.createdAt,
            link: {
                url: `/apply/get-advice/edit/${application.id}`,
                label: 'Continue'
            }
        };
    } else {
        return {
            type: 'submitted',
            id: application.id,
            formId: application.formId,
            projectName: data.projectName,
            amountRequested: `£${sumBy(
                getOr([], 'projectBudget', data),
                item => parseInt(item.cost, 10) || 0
            ).toLocaleString()}`,
            overview: [
                {
                    label: 'Project dates',
                    value: '2 December, 2020–2 December, 2020'
                },
                {
                    label: 'Location',
                    value: 'Sutton Coldfield'
                },
                {
                    label: 'Organisation',
                    value: 'The Scouts of Sutton Coldfield'
                }
            ],
            submittedAt: application.createdAt
        };
    }
}

/**
 * Determine the latest application to show and
 * prepare application data for display in the view.
 */
async function getLatestApplication(userId, locale) {
    const [pending, submitted] = await Promise.all([
        PendingApplication.findLatestByUserId(userId),
        SubmittedApplication.findLatestByUserId(userId)
    ]);

    if (pending && submitted) {
        if (moment(pending.updatedAt).isAfter(submitted.updatedAt)) {
            return enrichPendingApplication(pending, locale);
        } else {
            return enrichSubmittedApplication(submitted);
        }
    } else if (submitted) {
        return enrichSubmittedApplication(submitted);
    } else if (pending) {
        return enrichPendingApplication(pending, locale);
    }
}

router.get(
    '/',
    csrfProtection,
    requireActiveUser,
    injectCopy('applyNext'),
    async function(req, res, next) {
        try {
            /**
             * Check for existing pending applications
             * Used to determine if "start a new application" action card
             * is in a primary or secondary style.
             * Secondary if we have a pending application for the product
             */
            const [pendingSimple, pendingStandard] = await Promise.all([
                PendingApplication.findUserApplicationsByForm({
                    userId: req.user.userData.id,
                    formId: 'awards-for-all'
                }),
                PendingApplication.findUserApplicationsByForm({
                    userId: req.user.userData.id,
                    formId: 'standard-enquiry'
                })
            ]);

            const viewData = {
                title: 'Dashboard - Latest Application',
                latestApplication: await getLatestApplication(
                    req.user.userData.id,
                    req.i18n.getLocale()
                ),
                hasPendingSimpleApplication: !isEmpty(pendingSimple),
                hasPendingStandardApplication: !isEmpty(pendingStandard)
            };

            res.render(path.resolve(__dirname, './views/dashboard'), viewData);
        } catch (err) {
            next(err);
        }
    }
);

router.get(
    '/all',
    csrfProtection,
    requireActiveUser,
    injectCopy('applyNext'),
    async function(req, res, next) {
        try {
            const [
                pendingApplications,
                submittedApplications
            ] = await Promise.all([
                PendingApplication.findAllByUserId(req.user.userData.id),
                SubmittedApplication.findAllByUserId(req.user.userData.id)
            ]);

            res.json({
                title: 'Dashboard - All Applications',
                pendingApplications: pendingApplications.map(application => {
                    enrichPendingApplication(req.i18n.getLocale(), application);
                }),
                submittedApplications: submittedApplications
            });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
