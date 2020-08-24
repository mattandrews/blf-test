'use strict';
const request = require('request-promise-native');
const { SALESFORCE_AUTH } = require('../../../../common/secrets');

class Salesforce {
    constructor(apiUrl, accessToken) {
        this.apiUrl = apiUrl;
        this.apiVersion = 'v45.0';
        this.headers = { Authorization: `Bearer ${accessToken}` };
    }
    get(urlPath) {
        return request.get({
            uri: `${this.apiUrl}${urlPath}`,
            headers: this.headers,
            json: true,
        });
    }
    postJson(urlPath, body) {
        return request.post({
            url: `${this.apiUrl}${urlPath}`,
            headers: this.headers,
            json: true,
            body: body,
        });
    }
    submitFormData({ application, meta }) {
        return this.postJson('/services/apexrest/FormData/', {
            meta: meta,
            application: application,
        });
    }
    async contentVersion({ recordId, attachmentName, versionData }) {
        return request.post({
            url: `${this.apiUrl}/services/data/${this.apiVersion}/sobjects/ContentVersion`,
            headers: this.headers,
            formData: {
                entity_content: {
                    value: JSON.stringify({
                        FirstPublishLocationId: recordId,
                        ReasonForChange: `Application attachment ${attachmentName}`,
                        PathOnClient: attachmentName,
                    }),
                    options: {
                        contentType: 'application/json',
                    },
                },
                VersionData: versionData,
            },
        });
    }
}

async function authorise() {
    const AUTH_URL = `https://${SALESFORCE_AUTH.apiUrl}/services/oauth2/token`;
    const resultJson = await request.post({
        url: AUTH_URL,
        json: true,
        form: {
            grant_type: 'password',
            client_id: SALESFORCE_AUTH.consumerKey,
            client_secret: SALESFORCE_AUTH.consumerSecret,
            username: SALESFORCE_AUTH.username,
            password: `${SALESFORCE_AUTH.password}${SALESFORCE_AUTH.token}`,
        },
    });

    return new Salesforce(resultJson.instance_url, resultJson.access_token);
}

async function sandboxAuthorise() {
    const AUTH_URL = `https://${SALESFORCE_AUTH.apiUrl}/services/oauth2/token`;
    const resultJson = await request.post({
        url: AUTH_URL,
        json: true,
        form: {
            grant_type: 'password',
            client_id: SALESFORCE_AUTH.sandboxConsumerKey,
            client_secret: SALESFORCE_AUTH.sandboxConsumerSecret,
            username: SALESFORCE_AUTH.sandboxUsername,
            password: `${SALESFORCE_AUTH.password}${SALESFORCE_AUTH.sandboxToken}`,
        },
    });

    return new Salesforce(resultJson.instance_url, resultJson.access_token);
}

function checkStatus() {
    return request({
        url: `https://api.status.salesforce.com/v1/instances/${SALESFORCE_AUTH.instanceId}/status`,
        json: true,
        timeout: 3000,
    });
}

module.exports = {
    authorise,
    sandboxAuthorise,
    checkStatus,
};
