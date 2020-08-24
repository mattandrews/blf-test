'use strict';
const path = require('path');
const moment = require('moment');
const get = require('lodash/get');

const { sendHtmlEmail } = require('../../../common/mail');

function getSubjectLine(emailType, isBilingual = false) {
    let subjectLine;
    switch (emailType) {
        case 'AFA_ONE_MONTH':
        case 'UNDER10K_ONE_MONTH':
            subjectLine = {
                en: 'You have one month to finish your application',
                cy: 'Mae gennych fis i orffen eich cais',
            };
            break;
        case 'AFA_ONE_WEEK':
        case 'UNDER10K_ONE_WEEK':
            subjectLine = {
                en: 'You have one week to finish your application',
                cy: 'Mae gennych wythnos i orffen eich cais',
            };
            break;
        case 'AFA_ONE_DAY':
        case 'UNDER10K_ONE_DAY':
            subjectLine = {
                en: 'You have one day to finish your application',
                cy: 'Mae gennych ddiwrnod i orffen eich cais',
            };
            break;
        case 'STANDARD_ONE_MONTH':
            subjectLine = {
                en: 'You have one month to finish your funding proposal',
                cy: 'Mae gennych fis ar ôl i orffen eich cynnig',
            };
            break;
        case 'STANDARD_ONE_WEEK':
            subjectLine = {
                en: 'You have one week to finish your funding proposal',
                cy: 'Mae gennych wythnos ar ôl i orffen eich cynnig',
            };
            break;
        case 'STANDARD_ONE_DAY':
            subjectLine = {
                en: 'You have one day to finish your funding proposal',
                cy: 'Mae gennych ddiwrnod ar ôl i orffen eich cynnig',
            };
            break;
    }

    if (isBilingual) {
        return [subjectLine.en, subjectLine.cy].join(' / ');
    } else {
        return subjectLine.en;
    }
}

function getEmailFor(country) {
    const countryEmail = {
        'scotland': 'advicescotland@tnlcommunityfund.org.uk',
        'northern-ireland': 'enquiries.ni@tnlcommunityfund.org.uk',
        'wales': 'wales@tnlcommunityfund.org.uk',
    }[country];

    return countryEmail || 'general.enquiries@tnlcommunityfund.org.uk';
}

function getPhoneFor(country) {
    const countryPhone = {
        'scotland': '0141 846 0447',
        'northern-ireland': '028 4378 0003',
        'wales': '029 2168 0214',
    }[country];

    return countryPhone || '028 9568 0143';
}

function getProjectCountry(applicationData, formId) {
    if (formId === 'awards-for-all') {
        return get(applicationData, 'projectCountry');
    } else if (formId === 'standard-enquiry') {
        const countries = get(applicationData, 'projectCountries');
        return countries && countries.length === 1 ? countries[0] : 'Multiple';
    }
}

function sendExpiryEmail(
    {
        formId,
        emailType,
        unsubscribeToken,
        applicationId,
        applicationData = {},
        expiresAt,
        sendTo,
    },
    mockMailTransport = null
) {
    const emailConfig = {
        'awards-for-all': {
            name: 'application_expiry_under10k',
            template: path.resolve(
                __dirname,
                './views/under10k-expiry-email.njk'
            ),
        },
        'standard-enquiry': {
            name: 'application_expiry_standard',
            template: path.resolve(
                __dirname,
                './views/over10k-proposal-expiry-email.njk'
            ),
        },
    }[formId];

    function getBilingualStatus() {
        if (formId === 'awards-for-all') {
            return get(applicationData, 'projectCountry') === 'wales';
        } else if (formId === 'standard-enquiry') {
            const countries = get(applicationData, 'projectCountries');
            return countries && countries.includes('wales');
        }
    }

    function getExpiryDates() {
        const expiresOn = moment(expiresAt);
        const dateFormat = 'D MMMM, YYYY h:mma';
        return {
            en: expiresOn.format(dateFormat),
            cy: expiresOn.locale('cy').format(dateFormat),
        };
    }

    const baseUrl = 'https://www.tnlcommunityfund.org.uk';

    const unsubscribeLinkUrlPath = `/apply/emails/unsubscribe?token=${unsubscribeToken}`;
    const unsubscribeLink = {
        en: `${baseUrl}${unsubscribeLinkUrlPath}`,
        cy: `${baseUrl}/welsh${unsubscribeLinkUrlPath}`,
    };

    const editLinkUrlPath = `/apply/${
        formId === 'awards-for-all' ? 'under-10k' : 'your-funding-proposal'
    }/edit/${applicationId}?s=expiryEmail`;
    const editLink = {
        en: `${baseUrl}${editLinkUrlPath}`,
        cy: `${baseUrl}/welsh/${editLinkUrlPath}`,
    };

    const templateData = {
        isBilingual: getBilingualStatus(),
        projectName: get(applicationData, 'projectName'),
        countryPhoneNumber: getPhoneFor(
            getProjectCountry(applicationData, formId)
        ),
        countryEmail: getEmailFor(getProjectCountry(applicationData, formId)),
        unsubscribeLink: unsubscribeLink,
        expiryDate: getExpiryDates(),
        editLink: editLink,
    };

    return sendHtmlEmail(
        {
            template: emailConfig.template,
            templateData: templateData,
        },
        {
            name: emailConfig.name,
            sendTo: sendTo,
            subject: getSubjectLine(emailType, getBilingualStatus()),
        },
        mockMailTransport
    );
}

module.exports = {
    getProjectCountry,
    sendExpiryEmail,
};
