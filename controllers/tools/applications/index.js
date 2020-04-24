'use strict';
const express = require('express');
const get = require('lodash/get');

const { DATA_STUDIO_UNDER10K_URL } = require('../../../common/secrets');

const { initApplicationStatsRouter } = require('./router');

const router = express.Router();

router.use(
    '/awards-for-all',
    initApplicationStatsRouter({
        applicationId: 'awards-for-all',
        title: 'Apply for funding under £10,000',
        getProjectCountry(applicationData) {
            return get(applicationData, 'projectCountry');
        },
        feedbackDescriptions: [
            'National Lottery Awards for All',
            'Apply for funding under £10,000',
        ],
        dataStudioUrl: DATA_STUDIO_UNDER10K_URL,
    })
);

router.use(
    '/standard-enquiry',
    initApplicationStatsRouter({
        applicationId: 'standard-enquiry',
        title: 'Apply for funding under £10,000',
        getProjectCountry(applicationData) {
            const countries = get(applicationData, 'projectCountries', []);
            return countries.length > 1 ? 'uk-wide' : countries[0];
        },
        feedbackDescriptions: ['Your funding proposal'],
    })
);

module.exports = router;
