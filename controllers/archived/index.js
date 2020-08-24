'use strict';
const path = require('path');
const express = require('express');

const router = express.Router();

const { buildArchiveUrl, makeWelsh } = require('../../common/urls');


/**
 * Handle legacy programme pages as wildcards
 * (eg. redirect them to /funding/programmes/<slug>)
 */
router.get('/:region?/global-content/programmes/:country/:slug', (req, res) => {
    const locale = req.params.region === 'welsh' ? '/welsh' : '';
    res.redirect(301, `${locale}/funding/programmes/${req.params.slug}`);
});

/**
 * Handle migrated A Better Start child pages as wildcards
 * (eg. redirect them to /funding/publications/a-better-start/<slug>)
 */
router.get(
    '/funding/strategic-investments/a-better-start/:slug',
    (req, res) => {
        res.redirect(
            301,
            `/funding/publications/a-better-start/${req.params.slug}`
        );
    }
);

/**
 * Archived Routes
 * Paths in this array will be redirected to the National Archives.
 * We show an interstitial page:
 * a) to let people know the page has been archived
 * b) to allow us to record the redirect as a standard page-view
 */
[
    '/about-big/10-big-lottery-fund-facts',
    '/about-big/big-lottery-fund-in-your-constituency',
    '/about-big/community-closed',
    '/about-big/countries*',
    '/about-big/future-of-doing-good',
    '/about-big/living-wage',
    '/about-big/mayors-community-weekend',
    '/about-big/our-approach/vision-and-principles',
    '/about-big/publications*',
    '/about-big/your-voice',
    '/funding/big-stories*',
    '/funding/celebrateuk*',
    '/funding/funding-guidance/applying-for-funding/*',
    '/funding/funding-guidance/managing-your-funding/about-equalities*',
    '/funding/funding-guidance/managing-your-funding/reaching-communities-grant-offer',
    '/funding/joint-funding',
    '/funding/peoples-projects-resources',
    '/funding/scotland-portfolio*',
    '/global-content/programmes/england/building-better-opportunities/building-better-opportunities-qa*',
    '/global-content/press-releases/*',
    '/research*',
].forEach((urlPath) => {
    function renderArchived(req, res) {
        res.setHeader('X-Robots-Tag', 'noindex');
        res.render(path.resolve(__dirname, './views/archived'), {
            title: 'Archived',
            archiveUrl: buildArchiveUrl(req.originalUrl),
        });
    }

    router.get(urlPath, renderArchived);
    router.get(makeWelsh(urlPath), renderArchived);
});

/**
 * Archived files
 * Requests for legacy files will be shown an error message
 * along with a feedback form to explain what they were looking for.
 */
router.get('/-/media/files/*', (req, res) => {
    res.locals.isBilingual = false;
    res.locals.enableSiteSurvey = false;

    res.setHeader('X-Robots-Tag', 'noindex');
    res.status(404).render(path.resolve(__dirname, './views/legacy-file'), {
        title: 'Document archived',
        filePath: req.originalUrl,
    });
});

module.exports = router;
