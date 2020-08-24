'use strict';
const { getParameter } = require('./parameter-store');

/**
 * Primary session secret
 * We allow overriding through an environment variable for CI
 */
const SESSION_SECRET =
    process.env.SESSION_SECRET || getParameter('session.secret', true);

/**
 * Database connection uri
 * Note: Our RDS databases are not accessible outside of a VPC.
 * We allow overriding through an environment variable for CI and local environments.
 */
const DB_CONNECTION_URI =
    process.env.DB_CONNECTION_URI || getParameter('db.connection-uri', true);

/**
 * Content API url
 * We allow overriding through an environment variable for CI and to allow
 * switching to a local instance of the CMS in development
 */
const CONTENT_API_URL =
    process.env.CONTENT_API_URL || getParameter('content-api.url', true);

/**
 * Content API Sandbox url
 * When the site is accessed by Staff using the TEST instance, they can switch on
 * Sandbox Mode, which means we use the Test instance of the CMS (eg. for staff training)
 */
const CONTENT_API_SANDBOX_URL =
    process.env.CONTENT_API_SANDBOX_URL ||
    getParameter('content-api.sandbox.url');

/**
 * Past grants API
 * We allow overriding through an environment variable for CI and to allow
 * switching to a local instance of the API in development
 */
const PAST_GRANTS_API_URI =
    process.env.PAST_GRANTS_API_URI || getParameter('pastgrants.api.uri', true);

/**
 * JWT signing token, used for user authentication
 * We allow overriding through an environment variable for CI
 */
const JWT_SIGNING_TOKEN =
    process.env.JWT_SIGNING_TOKEN || getParameter('user.jwt.secret', true);

/**
 * Sentry DSN for error reporting
 */
const SENTRY_DSN = getParameter('sentry.publicDsn');

/**
 * Azure authentication secrets (optional, used for tools sign-in)
 */
const AZURE_AUTH = {
    metadataUrl: `https://login.microsoftonline.com/tnlcommunityfund.onmicrosoft.com/.well-known/openid-configuration`,
    clientId: getParameter('ms.auth.tnlcf.clientId'),
    clientSecret: getParameter('ms.auth.tnlcf.clientSecret'),
    redirectUrl:
        process.env.MS_REDIRECT_URL || getParameter('ms.auth.redirectUrl'),
};

/**
 * Salesforce authentication
 */
const SALESFORCE_AUTH = {
    apiUrl: process.env.SALESFORCE_API_URL || getParameter('salesforce.apiUrl'),
    consumerKey:
        process.env.SALESFORCE_CONSUMER_KEY ||
        getParameter('salesforce.consumerKey'),
    consumerSecret:
        process.env.SALESFORCE_CONSUMER_SECRET ||
        getParameter('salesforce.consumerSecret'),
    username:
        process.env.SALESFORCE_USERNAME || getParameter('salesforce.username'),
    password:
        process.env.SALESFORCE_PASSWORD || getParameter('salesforce.password'),
    token: process.env.SALESFORCE_TOKEN || getParameter('salesforce.token'),
    instanceId:
        process.env.SALESFORCE_INSTANCE_ID ||
        getParameter('salesforce.instanceId'),
    sandboxConsumerKey:
        process.env.SANDBOX_SALESFORCE_CONSUMER_KEY ||
        getParameter('sandbox.salesforce.consumerKey'),
    sandboxConsumerSecret:
        process.env.SANDBOX_SALESFORCE_CONSUMER_SECRET ||
        getParameter('sandbox.salesforce.consumerSecret'),
    sandboxUsername:
        process.env.SANDBOX_SALESFORCE_USERNAME ||
        getParameter('sandbox.salesforce.username'),
    sandboxToken:
        process.env.SANDBOX_SALESFORCE_TOKEN ||
        getParameter('sandbox.salesforce.token'),
};

// These expire in July 2021
const BANK_API = {
    KEY: process.env.BANK_API_TOKEN || getParameter('bank.api.key'),
    PASSWORD:
        process.env.BANK_API_PASSWORD || getParameter('bank.api.password'),
};

/**
 * Material supplier email
 * Used for sending order emails when placing and order for free materials
 */
const MATERIAL_SUPPLIER =
    process.env.MATERIAL_SUPPLIER || getParameter('emails.materials.supplier');

const POSTCODES_API_KEY =
    process.env.POSTCODES_API_KEY || getParameter('postcodes.api.key');

const S3_KMS_KEY_ID =
    process.env.S3_KMS_KEY_ID || getParameter('s3.kms.key.id');

/**
 * Email expiry secret
 * A shared token sent in POST requests to the email API endpoints
 * (eg. for emailing about soon-to-expire applications)
 */
const EMAIL_EXPIRY_SECRET =
    process.env.EMAIL_EXPIRY_SECRET || getParameter('emailExpiry.secret');

const EMAIL_EXPIRY_TEST_ADDRESS =
    process.env.EMAIL_EXPIRY_TEST_ADDRESS ||
    getParameter('emailExpiry.testEmail');

/**
 * DotDigital API credentials
 * Used to sign up to email lists
 */
const DOTDIGITAL_API = {
    user: process.env.DOTDIGITAL_USER || getParameter('dotdigital.api.user'),
    password:
        process.env.DOTDIGITAL_PASS || getParameter('dotdigital.api.password'),
};

/**
 * Sandbox domain
 * Used to specify the requested salesforce endpoint
 * */

const SALESFORCE_SANDBOX_DOMAIN =
    process.env.SALESFORCE_SANDBOX_DOMAIN || getParameter('sandbox.test.domain');

module.exports = {
    AZURE_AUTH,
    BANK_API,
    CONTENT_API_URL,
    CONTENT_API_SANDBOX_URL,
    DB_CONNECTION_URI,
    DOTDIGITAL_API,
    EMAIL_EXPIRY_SECRET,
    EMAIL_EXPIRY_TEST_ADDRESS,
    JWT_SIGNING_TOKEN,
    MATERIAL_SUPPLIER,
    PAST_GRANTS_API_URI,
    POSTCODES_API_KEY,
    SALESFORCE_SANDBOX_DOMAIN,
    S3_KMS_KEY_ID,
    SALESFORCE_AUTH,
    SENTRY_DSN,
    SESSION_SECRET,
};
