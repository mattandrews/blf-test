'use strict';
const path = require('path');
const express = require('express');
const { concat } = require('lodash');

const router = express.Router();

const strandTitle = 'Scale your impact';

router.get('/', (req, res) => {
    res.render(path.resolve(__dirname, './views/strand-2'), {
        title: 'Using digital to scale your impact',
        heroImage: res.locals.heroImage,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: strandTitle }])
    });
});

router.get('/eligibility', (req, res) => {
    const title = 'Request a call';
    res.render(path.resolve(__dirname, './views/strand-2-eligibility'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: strandTitle, url: './' }, { label: title }])
    });
});

router.get('/eligibility/no', (req, res) => {
    const title = 'Request a call';
    res.render(path.resolve(__dirname, './views/strand-2-no'), {
        title: title,
        breadcrumbs: concat(res.locals.breadcrumbs, [{ label: strandTitle, url: './' }, { label: title }])
    });
});

module.exports = router;
