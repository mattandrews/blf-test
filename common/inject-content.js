'use strict';
const { flatten, get, getOr } = require('lodash/fp');
const moment = require('moment');
const Sentry = require('@sentry/node');

const { localify } = require('./urls');
const contentApi = require('./content-api');

/*
 * Populate hero image (with social image URLs too)
 * */
function setHeroLocals({ res, entry }) {
    // @TODO: Rename this once API has been updated back to `hero`
    const heroImage = get('heroNew.image')(entry);
    const heroCredit = get('heroNew.credit')(entry);

    if (heroImage) {
        res.locals.pageHero = {
            image: heroImage,
            credit: heroCredit
        };
        res.locals.socialImage = heroImage;
    } else {
        res.locals.pageHero = null;
    }
}

/**
 * Sets locals that are common to many entries.
 * - title based on content
 * - isBilingual based on availableLanguages property
 * - preview status metadata
 * - pageHero (with optional fallback)
 * - optional custom theme colour
 */
function setCommonLocals({ res, entry }) {
    res.locals.title = entry.title;

    res.locals.isBilingual = entry.availableLanguages.length === 2;
    res.locals.openGraph = get('openGraph')(entry);

    res.locals.previewStatus = {
        isDraftOrVersion:
            entry.status === 'draft' || entry.status === 'version',
        lastUpdated: moment(entry.dateUpdated.date).format(
            'Do MMM YYYY [at] h:mma'
        )
    };

    setHeroLocals({ res, entry });
}

function injectHeroImage(heroSlug) {
    return async function(req, res, next) {
        if (heroSlug) {
            const { fallbackHeroImage } = res.locals;

            // Set defaults
            res.locals.pageHero = { image: fallbackHeroImage };
            res.locals.socialImage = fallbackHeroImage;

            try {
                const image = await contentApi.getHeroImage({
                    locale: req.i18n.getLocale(),
                    slug: heroSlug
                });

                res.locals.pageHero = { image: image };
                res.locals.socialImage = image;
                next();
            } catch (error) {
                Sentry.captureException(error);
                next();
            }
        } else {
            next();
        }
    };
}

function injectCopy(lang) {
    return function(req, res, next) {
        if (lang) {
            const copy = req.i18n.__(lang);
            res.locals.copy = copy;
            res.locals.title = copy.title;
            res.locals.description = copy.description || false;
        }

        next();
    };
}

function injectBreadcrumbs(req, res, next) {
    const locale = req.i18n.getLocale();

    if (res.locals.sectionTitle && res.locals.sectionUrl) {
        const topLevelCrumb = {
            label: res.locals.sectionTitle,
            url: res.locals.sectionUrl
        };

        const ancestors =
            res.locals.customAncestors ||
            getOr([], 'ancestors')(res.locals.content);
        const ancestorCrumbs = ancestors.map(ancestor => {
            return {
                label: ancestor.title,
                url: localify(locale)(`/${ancestor.path}`)
            };
        });

        const breadcrumbs = flatten([topLevelCrumb, ancestorCrumbs]);

        const getTitle = get('title');
        const injectedTitle = res.locals.title || getTitle(res.locals.content);

        if (injectedTitle) {
            breadcrumbs.push({
                label: injectedTitle
            });
        }

        res.locals.breadcrumbs = breadcrumbs;
    }

    next();
}

async function injectListingContent(req, res, next) {
    try {
        let query = {};
        if (req.query.social) {
            query.social = req.query.social;
        }
        const content = await contentApi.getListingPage({
            locale: req.i18n.getLocale(),
            path: req.baseUrl + req.path,
            query: query,
            requestParams: req.query
        });

        if (content) {
            res.locals.content = content;
            setCommonLocals({ res, entry: content });
        }

        next();
    } catch (error) {
        next(error);
    }
}

async function injectFlexibleContent(req, res, next) {
    try {
        let query = {};
        if (req.query.social) {
            query.social = req.query.social;
        }
        const content = await contentApi.getFlexibleContent({
            locale: req.i18n.getLocale(),
            path: req.baseUrl + req.path,
            query: query,
            requestParams: req.query
        });

        if (content) {
            res.locals.content = content;
            setCommonLocals({ res, entry: content });
        }

        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Inject funding programme detail
 * Assumes a parameter of :slug in the request
 */
async function injectFundingProgramme(req, res, next) {
    try {
        let query = {};
        if (req.query.social) {
            query.social = req.query.social;
        }

        let slug = req.params.programmeSlug;
        if (req.params.childPageSlug) {
            slug += `/${req.params.childPageSlug}`;
        }

        const entry = await contentApi.getFundingProgramme({
            slug: slug,
            locale: req.i18n.getLocale(),
            query: query,
            requestParams: req.query
        });

        res.locals.fundingProgramme = entry;
        setCommonLocals({ res, entry });
        next();
    } catch (error) {
        if (error.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
}

async function injectStrategicProgramme(req, res, next) {
    try {
        // Assumes a parameter of :slug and :childPageSlug? in the request
        const { slug, childPageSlug } = req.params;
        let query = {};
        if (req.query.social) {
            query.social = req.query.social;
        }
        if (slug) {
            const querySlug = childPageSlug ? `${slug}/${childPageSlug}` : slug;

            const entry = await contentApi.getStrategicProgrammes({
                slug: querySlug,
                locale: req.i18n.getLocale(),
                query: query,
                requestParams: req.query
            });

            res.locals.strategicProgramme = entry;
            setCommonLocals({ res, entry });
        }
        next();
    } catch (error) {
        if (error.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
}

async function injectStrategicProgrammes(req, res, next) {
    try {
        res.locals.strategicProgrammes = await contentApi.getStrategicProgrammes(
            {
                locale: req.i18n.getLocale(),
                requestParams: req.query
            }
        );
        next();
    } catch (error) {
        if (error.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
}

async function injectResearch(req, res, next) {
    try {
        const research = await contentApi.getResearch({
            locale: req.i18n.getLocale(),
            requestParams: req.query
        });
        res.locals.researchEntries = research.result;
        res.locals.researchMeta = research.meta;
        next();
    } catch (error) {
        if (error.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
}

async function injectResearchEntry(req, res, next) {
    try {
        // Assumes a parameter of :slug in the request
        const { slug } = req.params;
        if (slug) {
            let query = {};
            if (req.query.social) {
                query.social = req.query.social;
            }

            const entry = await contentApi.getResearch({
                slug: slug,
                locale: req.i18n.getLocale(),
                query: query,
                requestParams: req.query
            });

            res.locals.researchEntry = entry;
            setCommonLocals({ res, entry });
        }
        next();
    } catch (error) {
        if (error.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
}

async function injectOurPeople(req, res, next) {
    try {
        res.locals.ourPeople = await contentApi.getOurPeople({
            locale: req.i18n.getLocale(),
            requestParams: req.query
        });

        next();
    } catch (error) {
        if (error.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
}

function injectMerchandise({ locale = null, showAll = false }) {
    return async (req, res, next) => {
        try {
            const localeToUse = locale ? locale : req.i18n.getLocale();
            res.locals.availableItems = await contentApi.getMerchandise(
                localeToUse,
                showAll
            );
            next();
        } catch (error) {
            next(error);
        }
    };
}

module.exports = {
    injectBreadcrumbs,
    injectCopy,
    injectFlexibleContent,
    injectFundingProgramme,
    injectHeroImage,
    injectListingContent,
    injectMerchandise,
    injectOurPeople,
    injectResearch,
    injectResearchEntry,
    injectStrategicProgramme,
    injectStrategicProgrammes,
    setCommonLocals,
    setHeroLocals
};
