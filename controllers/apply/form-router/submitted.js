'use strict';
const config = require('config');
const path = require('path');
const express = require('express');
const get = require('lodash/fp/get');
const { localify } = require('../../../common/urls');
const fs = require('fs');
const nunjucks = require('nunjucks');
const pdf = require('html-pdf');

module.exports = function (formBuilder) {
    const router = express.Router();

    router.get('/:pdf?', async function (req, res, next) {
        const {
            submittedApplicationData,
            enrichedSubmittedApplication,
        } = res.locals;

        res.locals.userNavigationLinks = [
            {
                url: `${res.locals.getCurrentUrl()}`,
                label: req.i18n.__('apply.navigation.summary'),
            },
            {
                url: res.locals.sectionUrl,
                label: req.i18n.__('apply.navigation.latestApplication'),
            },
            {
                url: `${res.locals.sectionUrl}/all`,
                label: req.i18n.__('apply.navigation.allApplications'),
            },
            {
                url: `${res.locals.sectionUrl}/submitted`,
                label: req.i18n.__('apply.navigation.submittedApplications'),
            },
            {
                url: localify(req.i18n.getLocale())('/user'),
                label: req.i18n.__('apply.navigation.account'),
            },
        ];

        const form = formBuilder({
            locale: req.i18n.getLocale(),
            data: submittedApplicationData,
        });

        const output = {
            form: form,
            application: enrichedSubmittedApplication,
            notices: null,
            currentProjectName: get('projectName')(submittedApplicationData),
            user: req.user.userData.username,
        };

        if (req.params.pdf) {
            const fileName = `${get('projectName')(
                submittedApplicationData
            )}.pdf`;
            const fileLocation = `${fileName}`;

            const filePath = path.resolve(
                __dirname,
                '../../../public/',
                fileLocation
            );

            // Repopulate existing global context so templates render properly
            const context = {
                ...res.locals,
                ...req.app.locals,
                ...output,
            };

            // Render the HTML template to a string
            nunjucks.render(
                path.resolve(__dirname, './views/submitted.njk'),
                context,
                (renderErr, html) => {
                    if (renderErr) {
                        next(renderErr);
                    } else {
                        pdf.create(html, {
                            format: 'A4',
                            border: '40px',
                            zoomFactor: '0.7',
                            phantomArgs: [
                                '--web-security=no',
                                '--local-url-access=false',
                            ],
                        }).toFile(filePath, function (error, result) {
                            // create file to send pdf file back to user does not take up space on our server
                            if (error) {
                                // report pdf creation error
                                console.log(error);
                            }
                        });
                    }
                }
            );
        } else {
            // Render the standard HTML page otherwise
            res.render(path.resolve(__dirname, './views/submitted'), output);
        }
    });

    return router;
};
