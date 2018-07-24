'use strict';

const { filter, forEach, isEmpty } = require('lodash');
const { getOr } = require('lodash/fp');

const { CONTENT_TYPES } = require('./route-types');
const { injectBreadcrumbs, injectListingContent, injectFlexibleContent } = require('../middleware/inject-content');
const { isBilingual, shouldServe } = require('../modules/pageLogic');
const { isWelsh } = require('../modules/urls');

function handleStaticPage(router, page) {
    router.get(page.path, injectBreadcrumbs, function(req, res, next) {
        const { copy, heroImage } = res.locals;
        const isBilingualOverride = getOr(true, 'isBilingual')(page);
        const shouldRedirectLang = (!isBilingualOverride || isEmpty(copy)) && isWelsh(req.originalUrl);

        if (shouldRedirectLang) {
            next();
        } else {
            res.render(page.template, {
                copy: copy,
                title: copy.title,
                description: copy.description || false,
                heroImage: heroImage || null,
                isBilingual: isBilingualOverride
            });
        }
    });
}

function handleBasicContentPage(router, page) {
    router.get(page.path, injectListingContent, injectBreadcrumbs, (req, res, next) => {
        const { content, breadcrumbs } = res.locals;
        if (content) {
            const template = (() => {
                if (page.template) {
                    return page.template;
                } else if (content.children) {
                    return 'common/listingPage';
                } else {
                    return 'common/informationPage';
                }
            })();

            res.render(template, { breadcrumbs });
        } else {
            next();
        }
    });
}

function handleFlexibleContentPage(router, page) {
    router.get(page.path, injectFlexibleContent, injectBreadcrumbs, (req, res, next) => {
        const { entry, breadcrumbs } = res.locals;
        if (entry) {
            const template = page.template || 'common/flexibleContent';
            res.render(template, {
                content: entry,
                title: entry.title,
                heroImage: entry.hero,
                breadcrumbs: breadcrumbs,
                isBilingual: isBilingual(entry.availableLanguages)
            });
        } else {
            next();
        }
    });
}

/**
 * Init routing
 * Set up path routing for a list of (static) pages
 */
function init({ router, pages }) {
    forEach(filter(pages, shouldServe), page => {
        switch (page.contentType) {
            case CONTENT_TYPES.STATIC:
                handleStaticPage(router, page);
                break;
            case CONTENT_TYPES.CMS_BASIC:
                handleBasicContentPage(router, page);
                break;
            case CONTENT_TYPES.CMS_FLEXIBLE_CONTENT:
                handleFlexibleContentPage(router, page);
                break;
            default:
                break;
        }
    });

    return router;
}

module.exports = {
    init
};
