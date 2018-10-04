'use strict';
const path = require('path');
const { pick } = require('lodash/fp');

const { generateHtmlEmail, sendEmail } = require('../../../services/mail');
const applications = require('../../../services/applications');
const appData = require('../../../modules/appData');
const { PROJECT_LOCATIONS } = require('./constants');

function formatDataForStorage(stepsData, formCopy) {
    return stepsData.map(originalStep => {
        const step = pick(['name', 'fieldsets'])(originalStep);
        step.fieldsets = step.fieldsets.map(originalFieldset => {
            const fieldset = pick(['legend', 'fields'])(originalFieldset);
            fieldset.fields = fieldset.fields.map(pick(['label', 'name', 'value'])).map(field => {
                // Merge in label from translation copy
                field.label = field.label || formCopy.fields[field.name].label;
                return field;
            });
            return fieldset;
        });
        return step;
    });
}

async function processor({ formModel, data, stepsWithValues, copy, mailTransport = null }) {
    /**
     * Store the application
     */
    const dataToStore = formatDataForStorage(stepsWithValues, copy);
    await applications.store(formModel, dataToStore);

    const customerSendTo = { name: data['contact-name'], address: data['contact-email'] };

    const locationMatch = PROJECT_LOCATIONS.find(l => l.value === data.location);

    const customerHtml = await generateHtmlEmail({
        template: path.resolve(__dirname, './emails/customer-email.njk'),
        templateData: {
            data: data,
            copy: copy,
            stepsCopy: copy.steps,
            fieldsCopy: copy.fields,
            summary: stepsWithValues,
            isArray: xs => Array.isArray(xs)
        }
    });

    const internalHtml = await generateHtmlEmail({
        template: path.resolve(__dirname, './emails/internal-email.njk'),
        templateData: {
            data: data,
            title: copy.title,
            stepsCopy: copy.steps,
            fieldsCopy: copy.fields,
            summary: stepsWithValues,
            isArray: xs => Array.isArray(xs)
        }
    });

    return Promise.all([
        sendEmail({
            name: 'youth_capacity_customer',
            mailConfig: {
                sendTo: customerSendTo,
                subject: 'Thank you for getting in touch with the Big Lottery Fund!',
                type: 'html',
                content: customerHtml
            },
            mailTransport: mailTransport
        }),
        sendEmail({
            name: 'youth_capacity_internal',
            mailConfig: {
                sendTo: appData.isNotProduction ? customerSendTo : locationMatch.email,
                subject: `${copy.title}: New expression of interest from ${data['organisation-name']}`,
                type: 'html',
                content: internalHtml
            },
            mailTransport: mailTransport
        })
    ]);
}

module.exports = {
    formatDataForStorage,
    processor
};
