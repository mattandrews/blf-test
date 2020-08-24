'use strict';
const config = require('config');
const express = require('express');
const path = require('path');
const unset = require('lodash/unset');

const {
    PendingApplication,
    SubmittedApplication,
} = require('../../../db/models');

const appData = require('../../../common/appData');
const commonLogger = require('../../../common/logger');
const { localify } = require('../../../common/urls');

const salesforceService = require('./lib/salesforce');
const { buildMultipartData } = require('./lib/file-uploads');

module.exports = function (
    formId,
    formBuilder,
    confirmationBuilder,
    currentlyEditingSessionKey
) {
    const router = express.Router();

    const logger = commonLogger.child({
        service: 'salesforce',
        formId: formId,
    });

    /**
     * Route: Submission
     */
    router.post('/', async (req, res, next) => {
        const { currentApplication, currentApplicationData } = res.locals;

        const form = formBuilder({
            locale: req.i18n.getLocale(),
            data: currentApplicationData,
            metadata: currentApplication.metadata,
        });

        if (form.progress.isComplete === false) {
            return res.redirect(req.baseUrl);
        }

        function renderConfirmation() {
            unset(req.session, currentlyEditingSessionKey());
            req.session.save(function () {
                const confirmation = confirmationBuilder({
                    locale: req.i18n.getLocale(),
                    data: currentApplicationData,
                });

                logger.info('Submission successful');

                res.render(path.resolve(__dirname, './views/confirmation'), {
                    title: confirmation.title,
                    confirmation: confirmation,
                    userNavigationLinks: [
                        {
                            url: res.locals.sectionUrl,
                            label: req.i18n.__(
                                'apply.navigation.latestApplication'
                            ),
                        },
                        {
                            url: `${res.locals.sectionUrl}/all`,
                            label: req.i18n.__(
                                'apply.navigation.allApplications'
                            ),
                        },
                        {
                            url: `${res.locals.sectionUrl}/submitted`,
                            label: req.i18n.__(
                                'apply.navigation.submittedApplications'
                            ),
                        },
                        {
                            url: localify(req.i18n.getLocale())('/user'),
                            label: req.i18n.__('apply.navigation.account'),
                        },
                    ],
                    form: form,
                });
            });
        }

        /**
         * Check whether this form has already been submitted
         * eg. accidental double click, reloading success screen etc.
         * and show a success message without attempting to submit again
         */
        const submittedApplicationExists = await SubmittedApplication.findByPk(
            currentApplication.id
        );

        if (submittedApplicationExists) {
            logger.warn('Duplicate submission prevented', {
                applicationId: currentApplication.id,
            });
            return renderConfirmation();
        }

        try {
            logger.info('Submission started');

            /**
             * Increment submission attempts
             * Allows us to report on failed submission attempts.
             */
            await currentApplication.increment('submissionAttempts');

            /**
             * Construct salesforce submission data
             * We also attach this to the SubmittedApplication record
             */
            let salesforceRecordId = null;
            const salesforceFormData = {
                application: form.forSalesforce(),
                meta: {
                    form: formId,
                    schemaVersion: form.schemaVersion,
                    environment: appData.environment,
                    commitId: appData.commitId,
                    locale: req.i18n.getLocale(),
                    clientIp: req.ip,
                    username: req.user.userData.username,
                    applicationId: currentApplication.id,
                    startedAt: currentApplication.createdAt.toISOString(),
                },
            };

            /**
             * Store submission in salesforce if enabled
             */
            if (
                config.get('features.enableSalesforceConnector') === true &&
                !appData.isTestServer
            ) {
                let salesforce = {};
                if (res.locals.USE_GMS_SANDBOX) {
                    salesforce = await salesforceService.sandboxAuthorise();
                } else {
                    salesforce = await salesforceService.authorise();
                }
                salesforceRecordId = await salesforce.submitFormData(
                    salesforceFormData
                );

                logger.info('FormData record created');

                /**
                 * We can consider an application "submitted" once the
                 * main FormData record has been created.
                 *
                 * Consider ContentVersion step optional
                 * but log an error for investigation if upload fails.
                 */
                try {
                    const contentVersionPromises = form
                        .getCurrentFields()
                        .filter((field) => field.type === 'file')
                        .map(async function (field) {
                            return buildMultipartData({
                                formId: formId,
                                applicationId: currentApplication.id,
                                filename: field.value.filename,
                            }).then((versionData) => {
                                return salesforce.contentVersion({
                                    recordId: salesforceRecordId,
                                    attachmentName: `${
                                        field.name
                                    }${path.extname(field.value.filename)}`,
                                    versionData: versionData,
                                });
                            });
                        });

                    await Promise.all(contentVersionPromises);
                } catch (error) {
                    logger.error('Error creating ContentVersion', error, {
                        applicationId: currentApplication.id,
                    });
                }
            } else {
                logger.debug(`Skipped salesforce submission`);
            }

            /**
             * Create a submitted application from pending state
             * SubmittedApplication holds a snapshot at the time of submission,
             * allowing submissions to be rendered separate to form model changes.
             */
            await SubmittedApplication.createFromPendingApplication({
                pendingApplication: currentApplication,
                form: form,
                userId: req.user.userData.id,
                formId: formId,
                salesforceRecord: {
                    id: salesforceRecordId,
                    submission: salesforceFormData,
                },
            });

            /**
             * Delete the pending application once the
             * SubmittedApplication has been created.
             */
            await PendingApplication.delete(
                currentApplication.id,
                req.user.userData.id
            );

            renderConfirmation();
        } catch (error) {
            logger.error('Submission failed: ', error);

            /**
             * Salesforce submission failed,
             * Check the instance status and log if not OK,
             * allows us to monitor how many applications get submitted during
             * maintenance windows to determine if we need some visible messaging.
             */
            try {
                const response = await salesforceService.checkStatus();

                if (response.status !== 'OK') {
                    logger.info(`Salesforce status ${response.status}`);
                }
            } catch (e) {} // eslint-disable-line no-empty

            next(error);
        }
    });

    return router;
};
