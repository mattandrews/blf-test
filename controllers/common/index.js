'use strict';
const path = require('path');
const express = require('express');
const Sentry = require('@sentry/node');
const isEmpty = require('lodash/isEmpty');

const {
    injectBreadcrumbs,
    injectCopy,
    injectFlexibleContent,
    injectHeroImage,
    injectListingContent
} = require('../../common/inject-content');
const { isWelsh } = require('../../common/urls');
const contentApi = require('../../common/content-api');

const getLayoutMode = require('./lib/get-layout-mode');

function staticPage({
    lang = null,
    template = null,
    heroSlug = null,
    projectStorySlugs = [],
    disableLanguageLink = false
} = {}) {
    const router = express.Router();

    router.get(
        '/',
        injectHeroImage(heroSlug),
        injectCopy(lang),
        injectBreadcrumbs,
        async function(req, res, next) {
            const { copy } = res.locals;

            function shouldRedirectLang() {
                return (
                    (disableLanguageLink === true || isEmpty(copy)) &&
                    isWelsh(req.originalUrl)
                );
            }

            if (shouldRedirectLang()) {
                next();
            } else {
                /**
                 * Inject project stories if we've been provided any slugs to fetch
                 */
                let stories;
                if (projectStorySlugs.length > 0) {
                    try {
                        stories = await contentApi.getProjectStories({
                            locale: req.i18n.getLocale(),
                            slugs: projectStorySlugs
                        });
                    } catch (error) {
                        Sentry.captureException(error);
                    }
                }

                res.render(template, {
                    title: copy.title,
                    description: copy.description || false,
                    isBilingual: disableLanguageLink === false,
                    stories: stories
                });
            }
        }
    );

    return router;
}

function renderCMSPage(res, content) {
    const childrenLayoutMode = getLayoutMode(content);

    // Reformat the child pages for plain-text links
    if (content.children && childrenLayoutMode === 'list') {
        content.children = content.children.map(page => {
            return {
                href: page.linkUrl,
                label: page.trailText || page.title
            };
        });
    }

    res.render(path.resolve(__dirname, './views/cms-page'), {
        childrenLayoutMode: childrenLayoutMode
    });
}

function renderListingPage(res, content) {
    // What layout mode should we use? (eg. do all of the children have an image?)
    const missingTrailImages = content.children.some(page => !page.trailImage);
    const childrenLayoutMode = missingTrailImages ? 'plain' : 'heroes';
    if (missingTrailImages) {
        content.children = content.children.map(page => {
            return {
                href: page.linkUrl,
                label: page.trailText || page.title
            };
        });
    }
    res.render(path.resolve(__dirname, './views/listing-page'), {
        childrenLayoutMode: childrenLayoutMode
    });
}

function basicContent({
    lang = null,
    customTemplate = null,
    cmsPage = false
} = {}) {
    const router = express.Router();

    router.get(
        '/',
        injectCopy(lang),
        injectListingContent,
        injectBreadcrumbs,
        (req, res, next) => {
            const { content } = res.locals;

            if (!content) {
                return next();
            }

            /**
             * Determine template to render:
             * 1. If using a custom template defer to that
             * 2. If using the new CMS page style, use that template
             * 2. If the response has child pages then render a listing page
             * 3. Otherwise, render an information page
             */
            if (customTemplate) {
                res.render(customTemplate);
            } else if (cmsPage) {
                renderCMSPage(res, content);
            } else if (content.children) {
                // @TODO: Deprecate these templates in favour of CMS pages (above)
                renderListingPage(res, content);
            } else if (
                content.introduction ||
                content.segments.length > 0 ||
                content.flexibleContent.length > 0
            ) {
                res.render(path.resolve(__dirname, './views/information-page'));
            } else {
                next();
            }
        }
    );

    return router;
}

function flexibleContent() {
    const router = express.Router();

    router.get(
        '/',
        injectFlexibleContent,
        injectBreadcrumbs,
        (req, res, next) => {
            if (res.locals.content) {
                res.render(
                    path.resolve(__dirname, './views/flexible-content'),
                    {
                        flexibleContent: res.locals.content.flexibleContent
                    }
                );
            } else {
                next();
            }
        }
    );

    return router;
}

function renderFlexibleContentChild(req, res, entry) {
    const breadcrumbs = entry.parent
        ? res.locals.breadcrumbs.concat([
              {
                  label: entry.parent.title,
                  url: entry.parent.linkUrl
              },
              { label: res.locals.title }
          ])
        : res.locals.breadcrumbs.concat([{ label: res.locals.title }]);

    res.render(path.resolve(__dirname, './views/flexible-content'), {
        breadcrumbs: breadcrumbs,
        flexibleContent: entry.content
    });
}

module.exports = {
    staticPage,
    basicContent,
    flexibleContent,
    renderFlexibleContentChild
};
