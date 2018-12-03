'use strict';

module.exports = {
    aws: {
        /**
         * Default AWS region
         * Note: Not all services are available in all regions
         * so this is occasionally overridden
         */
        region: 'eu-west-2',
        cloudfrontDistributions: {
            test: {
                distributionId: 'E3D5QJTWAG3GDP',
                origins: {
                    legacy: 'LEGACY',
                    newSite: 'ELB-TEST'
                }
            },
            live: {
                distributionId: 'E2WYWBLMWIN5U1',
                origins: {
                    legacy: 'LEGACY',
                    newSite: 'ELB_LIVE'
                }
            }
        }
    },
    siteDomain: 'www.biglotteryfund.org.uk',
    /**
     * Common date format strings
     * @see http://momentjs.com/docs/#/displaying/format/
     */
    dateFormats: {
        month: 'MMMM YYYY',
        short: 'D MMMM, YYYY',
        full: 'dddd D MMMM YYYY',
        fullTimestamp: 'dddd D MMM YYYY (hh:mm a)'
    },
    i18n: {
        urlPrefix: {
            cy: '/welsh'
        }
    },
    features: {
        enableDigitalFundApplications: true,
        enablePrompt: false,
        enableSurvey: true,
        enableAbTests: true,
        enableHotjar: false,
        useRemoteAssets: true,
        enableTimingMetrics: false,
        enableMailSendMetrics: false,
        enableRelatedGrants: false
    },
    imgix: {
        mediaDomain: 'biglotteryfund-assets.imgix.net'
    },
    cookies: {
        contrast: 'contrastMode',
        features: 'blf-features',
        rebrand: 'tnlcf-rebrand',
        session: 'blf-alpha-session'
    },
    googleAnalyticsCode: 'UA-98908627-1',
    legacyDomain: 'https://wwwlegacy.biglotteryfund.org.uk',
    ebulletinApiEndpoint: 'https://apiconnector.com/v2',
    grants: {
        dateRange: {
            start: '2004-04-01',
            end: '2018-10-31'
        },
        grantNavLink:
            'http://grantnav.threesixtygiving.org/search?json_query=%7B%22query%22%3A+%7B%22bool%22%3A+%7B%22filter%22%3A+%5B%7B%22bool%22%3A+%7B%22should%22%3A+%5B%7B%22term%22%3A+%7B%22fundingOrganization.id_and_name%22%3A+%22%5B%5C%22The+Big+Lottery+Fund%5C%22%2C+%5C%22360G-blf%5C%22%5D%22%7D%7D%5D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%2C+%22must%22%3A+%7B%7D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%7B%22range%22%3A+%7B%22amountAwarded%22%3A+%7B%7D%7D%7D%2C+%22must%22%3A+%7B%7D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%7D%7D%5D%2C+%22must%22%3A+%7B%22query_string%22%3A+%7B%22default_field%22%3A+%22_all%22%2C+%22query%22%3A+%22%2A%22%7D%7D%7D%7D%2C+%22sort%22%3A+%7B%22_score%22%3A+%7B%22order%22%3A+%22desc%22%7D%7D%2C+%22aggs%22%3A+%7B%22recipientDistrictName%22%3A+%7B%22terms%22%3A+%7B%22size%22%3A+3%2C+%22field%22%3A+%22recipientDistrictName%22%7D%7D%2C+%22currency%22%3A+%7B%22terms%22%3A+%7B%22size%22%3A+3%2C+%22field%22%3A+%22currency%22%7D%7D%2C+%22recipientOrganization%22%3A+%7B%22terms%22%3A+%7B%22size%22%3A+3%2C+%22field%22%3A+%22recipientOrganization.id_and_name%22%7D%7D%2C+%22fundingOrganization%22%3A+%7B%22terms%22%3A+%7B%22size%22%3A+3%2C+%22field%22%3A+%22fundingOrganization.id_and_name%22%7D%7D%2C+%22recipientRegionName%22%3A+%7B%22terms%22%3A+%7B%22size%22%3A+3%2C+%22field%22%3A+%22recipientRegionName%22%7D%7D%7D%2C+%22extra_context%22%3A+%7B%22awardYear_facet_size%22%3A+3%2C+%22amountAwardedFixed_facet_size%22%3A+3%7D%7D'
    }
};
