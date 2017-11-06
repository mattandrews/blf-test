'use strict';
const express = require('express');
const router = express.Router();
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const generateSchema = require('generate-schema');
const { body, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');
const xss = require('xss');

const globals = require('../../modules/boilerplate/globals');
const routes = require('../routes');
const models = require('../../models/index');
const auth = require('../../modules/authed');

const LAUNCH_DATE = moment();

const USER_LEVEL_REQUIRED = 5;

const localeFiles = {
    en: '../../config/locales/en.json',
    cy: '../../config/locales/cy.json'
};

// status page used by load balancer
router.get('/status', (req, res) => {
    // don't cache this page!
    res.cacheControl = { maxAge: 0 };
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Content-Type', 'application/json');
    const appData = globals.get('appData');
    res.send({
        APP_ENV: process.env.NODE_ENV,
        DEPLOY_ID: appData.deployId,
        COMMIT_ID: appData.commitId,
        BUILD_NUMBER: appData.buildNumber,
        START_DATE: LAUNCH_DATE.format('dddd, MMMM Do YYYY, h:mm:ss a'),
        UPTIME: LAUNCH_DATE.toNow(true)
    });
});

// pagelist
router.get('/status/pages', (req, res) => {
    const totals = {
        canonical: [],
        aliases: [],
        vanityRedirects: routes.vanityRedirects.filter(r => r.aliasOnly).map(r => r.path),
        redirectedPages: routes.vanityRedirects.filter(r => !r.aliasOnly).map(r => r.path)
    };

    for (let s in routes.sections) {
        let section = routes.sections[s];
        for (let p in section.pages) {
            let page = section.pages[p];
            if (page.live) {
                totals.canonical.push(page.name);
                if (page.aliases) {
                    page.aliases.forEach(p => totals.aliases.push(p));
                }
            }
        }
    }

    res.render('pages/tools/pagelist', {
        routes: routes.sections,
        vanityRedirects: routes.vanityRedirects,
        totals: totals
    });
});

router.route('/tools/survey-results/').get(auth.requireAuthedLevel(USER_LEVEL_REQUIRED), (req, res) => {
    models.Survey
        .findAll({
            include: [
                {
                    model: models.SurveyChoice,
                    as: 'choices',
                    required: true,
                    include: [
                        {
                            model: models.SurveyResponse,
                            as: 'responses',
                            required: true
                        }
                    ]
                }
            ]
        })
        .then(surveys => {
            res.render('pages/tools/surveys', {
                surveys: surveys
            });
        })
        .catch(err => {
            res.send(err);
        });
});

// language file editor tool
router
    .route('/tools/locales/')
    .get(auth.requireAuthedLevel(USER_LEVEL_REQUIRED), (req, res) => {
        // don't cache this page!
        res.cacheControl = { maxAge: 0 };
        res.render('pages/tools/langEditor', {
            user: req.user
        });
    })
    .post(auth.requireAuthedLevel(USER_LEVEL_REQUIRED), (req, res) => {
        // fetch these each time
        const locales = {
            en: JSON.parse(fs.readFileSync(path.join(__dirname, localeFiles.en), 'utf8')),
            cy: JSON.parse(fs.readFileSync(path.join(__dirname, localeFiles.cy), 'utf8'))
        };
        res.send({
            editors: [
                {
                    name: 'English',
                    code: 'en',
                    json: locales.en,
                    schema: generateSchema.json(locales.en)
                },
                {
                    name: 'Welsh',
                    code: 'cy',
                    json: locales.cy,
                    schema: generateSchema.json(locales.cy)
                }
            ]
        });
    });

// update a language file
router.post('/tools/locales/update/', auth.requireAuthedLevel(USER_LEVEL_REQUIRED), (req, res) => {
    const json = req.body;
    let validKeys = ['en', 'cy'];
    let failedUpdates = [];

    validKeys.forEach(locale => {
        if (json[locale]) {
            let jsonToWrite = JSON.stringify(json[locale], null, 4);
            try {
                let filePath = path.join(__dirname, `../../config/locales/${locale}.json`);
                fs.writeFileSync(filePath, jsonToWrite);
            } catch (err) {
                failedUpdates.push(locale);
                return console.error(`Error saving ${locale} language`, err);
            }
        }
    });

    res.send({
        error: failedUpdates.length > 0 ? failedUpdates : false
    });
});

// edit news articles
const editNewsPath = '/tools/edit-news';
router
    .route(editNewsPath + '/:id?')
    .get(auth.requireAuthedLevel(USER_LEVEL_REQUIRED), (req, res, next) => {
        // don't cache this page!
        res.cacheControl = { maxAge: 0 };

        let queries = [];
        queries.push(
            models.News.findAll({
                order: [['updatedAt', 'DESC']]
            })
        );

        if (req.params.id) {
            queries.push(models.News.findById(req.params.id));
        }

        Promise.all(queries).then(responses => {
            if (req.params.id) {
                if (!responses[1]) {
                    return next();
                }
                req.flash('formValues', responses[1]);
            }
            res.render('pages/tools/newsEditor', {
                news: responses[0],
                id: req.params.id,
                status: req.flash('newsStatus'),
                user: req.user
            });
        });
    })
    .post(
        auth.requireAuthedLevel(USER_LEVEL_REQUIRED),
        [
            body('title_en', 'Please provide an English title')
                .exists()
                .not()
                .isEmpty(),
            body('title_cy', 'Please provide a Welsh title')
                .exists()
                .not()
                .isEmpty(),
            body('text_en', 'Please provide an English summary')
                .exists()
                .not()
                .isEmpty(),
            body('text_cy', 'Please provide a Welsh summary')
                .exists()
                .not()
                .isEmpty(),
            body('link_en', 'Please provide an English article link')
                .exists()
                .not()
                .isEmpty(),
            body('link_cy', 'Please provide a Welsh article link')
                .exists()
                .not()
                .isEmpty()
        ],
        (req, res) => {
            let redirectBase = req.baseUrl + editNewsPath + '/';
            const errors = validationResult(req);
            const data = matchedData(req, { locations: ['body'] });

            if (!errors.isEmpty()) {
                req.flash('formErrors', errors.array());
                req.flash('formValues', data);
                req.session.save(() => {
                    res.redirect(redirectBase + '?error');
                });
            } else {
                // sanitise input
                let rowData = {
                    title_en: xss(data['title_en']),
                    title_cy: xss(data['title_cy']),
                    text_en: xss(data['text_en']),
                    text_cy: xss(data['text_cy']),
                    link_en: xss(data['link_en']),
                    link_cy: xss(data['link_cy'])
                };

                if (req.params.id) {
                    rowData.id = req.params.id;
                }

                if (req.body.action === 'delete' && req.params.id) {
                    models.News.destroy({
                        where: {
                            id: req.params.id
                        }
                    });
                } else {
                    models.News.upsert(rowData);
                }
                req.flash('newsStatus', 'success');
                req.session.save(() => {
                    res.redirect(redirectBase + '?success');
                });
            }
        }
    );

module.exports = router;
