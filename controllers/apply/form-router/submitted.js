'use strict';
const path = require('path');
const express = require('express');
const get = require('lodash/fp/get');

module.exports = function (formBuilder) {
    const router = express.Router();

    router.get('/', async function (req, res) {
        const {
            submittedApplicationData,
            enrichedSubmittedApplication,
        } = res.locals;

        const form = formBuilder({
            locale: req.i18n.getLocale(),
            data: submittedApplicationData,
        });

        res.render(path.resolve(__dirname, './views/submitted'), {
            form: form,
            application: enrichedSubmittedApplication,
            notices: null,
            currentProjectName: get('projectName')(submittedApplicationData),
            user: req.user.userData.username,
        });
    });

    return router;
};
