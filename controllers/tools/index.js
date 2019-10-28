'use strict';
const path = require('path');
const express = require('express');

const { requireStaffAuth } = require('../../common/authed');
const { noStore } = require('../../common/cached');

const router = express.Router();

router.use(noStore, requireStaffAuth, function(req, res, next) {
    res.setHeader('X-Robots-Tag', 'noindex');
    res.locals.isBilingual = false;
    res.locals.enableSiteSurvey = false;
    res.locals.bodyClass = 'has-static-header'; // No hero images on tools pages
    res.locals.user = req.user;
    res.locals.breadcrumbs = [{ label: 'Tools', url: req.baseUrl }];
    next();
});

router.route('/').get((req, res) => {
    res.render(path.resolve(__dirname, './views/index'), {
        title: 'Staff tools',
        links: [
            {
                href: '/tools/users',
                label: 'User accounts summary'
            },
            {
                href: '/tools/applications/awards-for-all',
                label: 'Awards for All application statistics'
            },
            {
                href: '/tools/applications/standard-enquiry',
                label: 'Your funding proposal application statistics'
            },
            {
                href: '/tools/survey-results',
                label: 'Site satisfaction survey results'
            },
            {
                href: '/tools/feedback-results',
                label: 'Page feedback survey responses'
            },
            {
                href: '/tools/order-stats',
                label: 'Statistics on recent material orders'
            }
        ]
    });
});

router.use('/feedback-results', require('./feedback'));
router.use('/survey-results', require('./surveys'));
router.use('/applications', require('./applications'));
router.use('/order-stats', require('./orders'));
router.use('/users', require('./users'));

module.exports = router;
