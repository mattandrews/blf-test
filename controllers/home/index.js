'use strict';
const path = require('path');
const express = require('express');

const contentApi = require('../../common/content-api');

const router = express.Router();

router.get('/', async function (req, res, next) {
    try {
        const entry = await contentApi.getHomepage(
            req.i18n.getLocale(),
            req.query
        );

        res.render(path.resolve(__dirname, './views/home'), {
            showCOVID19AnnouncementBanner: false,
            featuredLinks: entry.featuredLinks,
            promotedUpdates: entry.promotedUpdates,
            heroImage: {
                small: '/assets/images/home/superhero-small-v2.jpg',
                medium: '/assets/images/home/superhero-medium-v2.jpg',
                large: '/assets/images/home/superhero-large-v2.jpg',
                default: '/assets/images/home/superhero-medium-v2.jpg',
                caption: 'Superstars Club',
            },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
