'use strict';
const moment = require('moment');

function generateEmailQueueItems(application, expiryEmailPeriods) {
    return expiryEmailPeriods.map(emailConfig => {
        return {
            applicationId: application.id,
            userId: application.userId,
            emailType: emailConfig.emailType,
            dateToSend: moment(application.expiresAt)
                .subtract(
                    emailConfig.sendBeforeExpiry.amount,
                    emailConfig.sendBeforeExpiry.unit
                )
                .hour(9)
                .minute(0)
                .second(0)
        };
    });
}

module.exports = {
    generateEmailQueueItems
};