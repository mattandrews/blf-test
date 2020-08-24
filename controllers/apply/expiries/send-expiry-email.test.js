/* eslint-env jest */
'use strict';
const nodemailer = require('nodemailer');
const moment = require('moment');

const { sendExpiryEmail } = require('./send-expiry-email');

const mockTransport = nodemailer.createTransport({
    jsonTransport: true,
});

test('Apply for funding under £10,000 expiry email', async function () {
    const info = await sendExpiryEmail(
        {
            emailType: 'UNDER10K_ONE_MONTH',
            unsubscribeToken: 'MOCK_TOKEN',
            formId: 'awards-for-all',
            applicationId: 'MOCK_APPLICATION_ID',
            applicationData: {
                projectCountry: 'england',
                projectName: 'Example project name',
            },
            expiresAt: moment('2050-06-01 12:00').toISOString(),
            sendTo: 'example@example.com',
        },
        mockTransport
    );

    const infoMessage = JSON.parse(info.message);

    expect(infoMessage.subject).toBe(
        'You have one month to finish your application'
    );
    expect(infoMessage.text).toMatchSnapshot();
});

test('Apply for funding under £10,000 welsh expiry email', async function () {
    const info = await sendExpiryEmail(
        {
            emailType: 'UNDER10K_ONE_MONTH',
            unsubscribeToken: 'MOCK_TOKEN',
            formId: 'awards-for-all',
            applicationId: 'MOCK_APPLICATION_ID',
            applicationData: {
                projectCountry: 'wales',
                projectName: 'Example project name',
            },
            expiresAt: moment('2050-06-01 12:00').toISOString(),
            sendTo: 'example@example.com',
        },
        mockTransport
    );

    const infoMessage = JSON.parse(info.message);

    expect(infoMessage.subject).toBe(
        'You have one month to finish your application / Mae gennych fis i orffen eich cais'
    );
    expect(infoMessage.text).toMatchSnapshot();
});

test('Your funding proposal expiry email', async function () {
    const info = await sendExpiryEmail(
        {
            emailType: 'STANDARD_ONE_MONTH',
            unsubscribeToken: 'MOCK_TOKEN',
            formId: 'standard-enquiry',
            applicationId: 'MOCK_APPLICATION_ID',
            applicationData: {
                projectCountries: ['england'],
                projectName: 'Example project name',
            },
            expiresAt: moment('2050-06-01 12:00').toISOString(),
            sendTo: 'example@example.com',
        },
        mockTransport
    );

    const infoMessage = JSON.parse(info.message);

    expect(infoMessage.subject).toBe(
        'You have one month to finish your funding proposal'
    );
    expect(infoMessage.text).toMatchSnapshot();
});

test('Your funding proposal welsh expiry email ', async function () {
    const info = await sendExpiryEmail(
        {
            emailType: 'STANDARD_ONE_MONTH',
            unsubscribeToken: 'MOCK_TOKEN',
            formId: 'standard-enquiry',
            applicationId: 'MOCK_APPLICATION_ID',
            applicationData: {
                projectCountries: ['wales'],
                projectName: 'Example project name',
            },
            expiresAt: moment('2050-06-01 12:00').toISOString(),
            sendTo: 'example@example.com',
        },
        mockTransport
    );

    const infoMessage = JSON.parse(info.message);

    expect(infoMessage.subject).toBe(
        'You have one month to finish your funding proposal / Mae gennych fis ar ôl i orffen eich cynnig'
    );
    expect(infoMessage.text).toMatchSnapshot();
});
