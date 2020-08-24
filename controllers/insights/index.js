'use strict';
const express = require('express');
const path = require('path');
const clone = require('lodash/clone');
const compact = require('lodash/compact');
const pick = require('lodash/pick');

const { ContentApiClient } = require('../../common/content-api');
const {
    injectHeroImage,
    setCommonLocals,
} = require('../../common/inject-content');
const { buildArchiveUrl, localify } = require('../../common/urls');
const {
    flexibleContentPage,
    renderFlexibleContentChild,
} = require('../common');

const router = express.Router();
const ContentApi = new ContentApiClient();

router.use(injectHeroImage('insights-letterbox-new'));

router.get('/', async (req, res, next) => {
    try {
        const research = await ContentApi.init({
            flags: res.locals.cmsFlags,
        }).getResearch({
            locale: req.i18n.getLocale(),
            requestParams: req.query,
        });

        res.render(path.resolve(__dirname, './views/insights-landing'), {
            title: req.i18n.__('insights.title'),
            researchEntries: research.result,
            researchArchiveUrl: buildArchiveUrl(
                localify(req.i18n.getLocale())('/research')
            ),
        });
    } catch (error) {
        next(error);
    }
});

router.get('/documents/:slug?', async function (req, res, next) {
    let query = pick(req.query, [
        'page',
        'programme',
        'tag',
        'doctype',
        'portfolio',
        'q',
        'sort',
    ]);
    res.locals.queryParams = clone(query);
    query['page-limit'] = 10;

    if (req.params.slug) {
        res.locals.documentSlug = req.params.slug;
        query['slug'] = req.params.slug;
    }

    try {
        const research = await ContentApi.init({
            flags: res.locals.cmsFlags,
        }).getResearch({
            locale: req.i18n.getLocale(),
            type: 'documents',
            query: query,
            requestParams: req.query,
        });

        res.locals.researchEntries = research.result;

        res.render(path.resolve(__dirname, './views/insights-documents'), {
            title: req.i18n.__('insights.documents.title'),
            entriesMeta: research.meta,
            pagination: research.pagination,
        });
    } catch (error) {
        if (error.response.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
});

router.use('/covid-19-resources/*', flexibleContentPage());

router.get('/:slug/:child_slug?', async function (req, res, next) {
    try {
        const entry = await ContentApi.init({
            flags: res.locals.cmsFlags,
        }).getResearch({
            slug: compact([req.params.slug, req.params.child_slug]).join('/'),
            locale: req.i18n.getLocale(),
            requestParams: req.query,
        });

        setCommonLocals(req, res, entry);

        if (entry && entry.entryType === 'contentPage') {
            renderFlexibleContentChild(req, res, entry);
        } else if (entry) {
            if (entry.parent) {
                res.locals.breadcrumbs.push({
                    label: entry.parent.title,
                    url: entry.parent.linkUrl,
                });
            }

            res.render(path.resolve(__dirname, './views/insights-detail'), {
                entry: entry,
                breadcrumbs: res.locals.breadcrumbs.concat({
                    label: entry.title,
                }),
            });
        } else {
            next();
        }
    } catch (error) {
        if (error.response.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
});

module.exports = router;
