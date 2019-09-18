'use strict';
const path = require('path');
const { generateHtmlEmail, sendEmail } = require('../../../common/mail');
const { Users, PendingApplication } = require('../../../db/models');
const { EXPIRY_EMAIL_REMINDERS } = require('../../apply/awards-for-all/constants');
const appData = require('../../../common/appData');
const logger = require('../../../common/logger').child({
    service: 'application-expiry'
});

const sendExpiryEmail = async (expiryApplications, expiryType) => {
    let status;

    if (appData.isNotProduction && !process.env.APPLICATION_EXPIRY_EMAIL) {
        throw new Error('Missing environment variable APPLICATION_EXPIRY_EMAIL');
    }

    const timeToFinishApp = ((type) => {
        switch(type) {
          case EXPIRY_EMAIL_REMINDERS.MONTH:
            return 'one month';
          case EXPIRY_EMAIL_REMINDERS.WEEK:
            return 'two weeks';
          default:
            return 'two days';
        }
    })(expiryType);

    expiryApplications.forEach(async (application) => {
        const email = (await Users.findEmailByUserId(application.userId)).username;

        const expiryHtml = await generateHtmlEmail({
            template: path.resolve(__dirname, './expiry-email.njk'),
            templateData: {
                timeToFinishApp,
                projectName: application.applicationData.projectName
            }
        });

        if (email) {
            status = await sendEmail({
                name: 'application_expiry',
                mailConfig: {
                    sendTo: appData.isNotProduction ? process.env.APPLICATION_EXPIRY_EMAIL : email,
                    subject: `You have ${timeToFinishApp} to finish your application`,
                    type: 'html',
                    content: expiryHtml
                }
            });
        }
    });

    return (status.response) ? true : false;
};

const updateDb = async (expiryApplications, expiryWarning, emailStatus) => {
    let dbStatus;

    if (emailStatus) {
        const applicationIds = expiryApplications.map(application => application.id);
        if (expiryWarning === EXPIRY_EMAIL_REMINDERS.EXPIRED) {
            // DELETE promise returns number of records affected directly
            dbStatus = await PendingApplication.bulkDeleteApplications(applicationIds);
        } else {
            // UPDATE promise returns an array containing number of records affected
            dbStatus = (await PendingApplication.updateExpiryWarning(applicationIds, expiryWarning))[0];
        }
    }

    return dbStatus === expiryApplications.length ? true : false;
};

const handleMonthExpiry = async (monthExpiryApplications) => {
    try {
        logger.info('Handling monthly expiry applications');
        
        // Fetch and Send Emails
        const emailStatus = await sendExpiryEmail(
            monthExpiryApplications,
            EXPIRY_EMAIL_REMINDERS.MONTH
        );

        // Update db
        const dbStatus = await updateDb(
            monthExpiryApplications,
            EXPIRY_EMAIL_REMINDERS.MONTH,
            emailStatus
        );

        return {
            emailSent: emailStatus,
            dbUpdated: dbStatus
        };
    } catch (err) {
        logger.error('Error handling monthly expiry applications: ', err);
        return { error: err.message };
    }
};

const handleWeekExpiry = async (weekExpiryApplications) => {
    try {
        logger.info('Handling weekly expiry applications');
        
        // Fetch and Send Emails
        const emailStatus = await sendExpiryEmail(
            weekExpiryApplications,
            EXPIRY_EMAIL_REMINDERS.WEEK
        );

        // Update db
        const dbStatus = await updateDb(
            weekExpiryApplications,
            EXPIRY_EMAIL_REMINDERS.WEEK,
            emailStatus
        );

        return {
            emailSent: emailStatus,
            dbUpdated: dbStatus
        };
    } catch (err) {
        logger.error('Error handling weekly expiry applications: ', err);
        return { error: err.message };
    }
};

const handleDayExpiry = async (dayExpiryApplications) => {
    try {
        logger.info('Handling daily expiry applications');
        
        // Fetch and Send Emails
        const emailStatus = await sendExpiryEmail(
            dayExpiryApplications,
            EXPIRY_EMAIL_REMINDERS.DAY
        );

        // Update db
        const dbStatus = await updateDb(
            dayExpiryApplications,
            EXPIRY_EMAIL_REMINDERS.DAY,
            emailStatus
        );

        return {
            emailSent: emailStatus,
            dbUpdated: dbStatus
        };
    } catch (err) {
        logger.error('Error handling daily expiry applications: ', err);
        return { error: err.message };
    }
};

const handleExpired = async (expiredApplications) => {
    try {
        logger.info('Handling expired applications');

        // Update db
        const dbStatus = await updateDb(
            expiredApplications,
            EXPIRY_EMAIL_REMINDERS.EXPIRED,
            emailStatus
        );

        return {
            dbUpdated: dbStatus
        };
    } catch (err) {
        logger.error('Error handling expired applications: ', err);
        return { error: err.message };
    }
};

module.exports = {
    handleMonthExpiry,
    handleWeekExpiry,
    handleDayExpiry,
    handleExpired
};
