'use strict';
const path = require('path');
const express = require('express');

const { SurveyAnswer } = require('../../../db/models');
const { sanitise } = require('../../../common/sanitise');

const csvSummary = require('./lib/csv-summary');
const pageCountsFor = require('./lib/page-counts');
const percentagesFor = require('./lib/percentages');
const voteDataFor = require('./lib/vote-data');

const { getDateRangeWithDefault } = require('../lib/date-helpers');

const router = express.Router();

router.get('/', async function (req, res, next) {
    try {
        const dateRange = getDateRangeWithDefault(
            req.query.start,
            req.query.end
        );

        const responses = await SurveyAnswer.findAllByPath(
            sanitise(req.query.path),
            dateRange
        );

        if (req.query.download && req.query.path && responses.length > 0) {
            res.attachment(`surveyResponses.csv`).send(csvSummary(responses));
        } else {
            const title = 'Surveys';
            res.render(path.resolve(__dirname, './views/survey'), {
                title: title,
                breadcrumbs: res.locals.breadcrumbs.concat({ label: title }),
                survey: {
                    totalResponses: responses.length,
                    voteData: voteDataFor(responses),
                    recentStats: percentagesFor(responses),
                    pageCounts: pageCountsFor(responses),
                    pageCountsWithResponses: pageCountsFor(
                        responses.filter((response) => response.message)
                    ),
                    noResponses: responses.filter(
                        (response) => response.choice === 'no'
                    ),
                },
                pathQuery: req.query.path,
                dateRange,
            });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
