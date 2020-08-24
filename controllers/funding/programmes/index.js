'use strict';
const path = require('path');
const express = require('express');
const compact = require('lodash/compact');
const get = require('lodash/get');
const groupBy = require('lodash/groupBy');

const {
    injectHeroImage,
    setCommonLocals,
} = require('../../../common/inject-content');
const { buildArchiveUrl, localify } = require('../../../common/urls');
const { sMaxAge } = require('../../../common/cached');
const { ContentApiClient } = require('../../../common/content-api');

const {
    renderFlexibleContentChild,
    flexibleContentPage,
} = require('../../common');

const getValidLocation = require('./lib/get-valid-location');
const programmeFilters = require('./lib/programme-filters');

const router = express.Router();
const ContentApi = new ContentApiClient();

router.use(function (req, res, next) {
    res.locals.breadcrumbs = res.locals.breadcrumbs.concat({
        label: req.i18n.__('funding.programmes.title'),
        url: req.baseUrl,
    });
    next();
});

/**
 * Programmes list
 */
router.get('/', injectHeroImage('rosemount-1-letterbox-new'), async function (
    req,
    res,
    next
) {
    try {
        const response = await ContentApi.init({
            flags: res.locals.cmsFlags,
        }).getFundingProgrammes({
            locale: req.i18n.getLocale(),
        });

        const allFundingProgrammes = response.result || [];

        const locationParam = getValidLocation(
            allFundingProgrammes,
            req.query.location
        );

        const covidStatuses = get(response.meta, 'covid19Statuses');
        if (covidStatuses) {
            res.locals.countryCovidStatus = covidStatuses.find(function (
                status
            ) {
                return (
                    status.country === locationParam ||
                    status.country === 'ukWide'
                );
            });
        }

        const programmesFilteredByAmount = allFundingProgrammes
            .filter(programmeFilters.filterByMinAmount(req.query.min))
            .filter(programmeFilters.filterByMaxAmount(req.query.max));

        const programmes = programmesFilteredByAmount.filter(
            programmeFilters.filterByLocation(locationParam)
        );

        const ukWideProgrammes = programmesFilteredByAmount.filter(
            programmeFilters.filterByLocation('ukWide')
        );

        const groupedProgrammes =
            locationParam && locationParam !== 'ukWide'
                ? groupBy(programmes.concat(ukWideProgrammes), 'area.label')
                : null;

        if (parseInt(req.query.min, 10) === 10000) {
            res.locals.breadcrumbs.push({
                label: req.i18n.__('funding.programmes.over10k'),
                url: '/over10k',
            });
        }

        if (parseInt(req.query.max, 10) === 10000) {
            res.locals.breadcrumbs.push({
                label: req.i18n.__('funding.programmes.under10k'),
                url: '/under10k',
            });
        }

        if (locationParam) {
            const globalCopy = req.i18n.__('global');
            res.locals.breadcrumbs.push({
                label: {
                    england: globalCopy.regions.england,
                    wales: globalCopy.regions.wales,
                    scotland: globalCopy.regions.scotland,
                    northernIreland: globalCopy.regions.northernIreland,
                    ukWide: globalCopy.regions.ukWide,
                }[locationParam],
            });
        }

        // If we have more than two breadcrumbs assign a url to the second (the current page)
        if (res.locals.breadcrumbs.length > 2) {
            res.locals.breadcrumbs[1].url = req.baseUrl;
        }

        const activeBreadcrumbsSummary = res.locals.breadcrumbs
            .map((breadcrumb) => breadcrumb.label)
            .join(', ');

        res.render(path.resolve(__dirname, './views/programmes-list'), {
            title: req.i18n.__('funding.programmes.title'),
            programmes,
            groupedProgrammes,
            activeBreadcrumbsSummary,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * All programmes
 */
router.get(
    '/all',
    sMaxAge(86400 /* 1 day in seconds */),
    injectHeroImage('cbsa-2-letterbox-new'),
    async function (req, res, next) {
        try {
            const response = await ContentApi.init({
                flags: res.locals.cmsFlags,
            }).getFundingProgrammes({
                locale: req.i18n.getLocale(),
                showAll: true,
                page: req.query.page || 1,
                pageLimit: 250,
            });

            const title = req.i18n.__('funding.allProgrammes.title');
            const allFundingProgrammes = response.result || [];

            const locationParam = getValidLocation(
                allFundingProgrammes,
                req.query.location
            );

            const programmes = allFundingProgrammes.filter(
                programmeFilters.filterByLocation(locationParam)
            );

            /**
             * Group programmes alpha-numerically
             */
            const groupedProgrammes = groupBy(programmes, function (programme) {
                const firstLetter = programme.title.split('')[0].toUpperCase();
                return /\d/.test(firstLetter) ? '#' : firstLetter;
            });

            const regionsCopy = req.i18n.__('global.regions');
            const locations = {
                england: regionsCopy.england,
                wales: regionsCopy.wales,
                scotland: regionsCopy.scotland,
                northernIreland: regionsCopy.northernIreland,
                ukWide: regionsCopy.ukWide,
            };

            const locationLinks = Object.entries(locations).map(
                ([key, value]) => ({
                    url: `${req.baseUrl}${req.path}?location=${key}`,
                    label: value,
                })
            );

            const breadcrumbs = res.locals.breadcrumbs.concat({
                label: title,
            });

            if (locationParam) {
                breadcrumbs.push({
                    label: locations[locationParam],
                });
            }

            // If we have more than three breadcrumbs assign a url to the third (the current page)
            if (breadcrumbs.length > 3) {
                breadcrumbs[2].url = req.baseUrl + req.path;
            }

            res.render(path.resolve(__dirname, './views/all-programmes'), {
                title: title,
                locationLinks: locationLinks,
                locationParam: locationParam,
                groupedProgrammes: groupedProgrammes,
                breadcrumbs: breadcrumbs,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * Programme detail
 */
router.get('/:slug/:child_slug?', async (req, res, next) => {
    try {
        const entry = await ContentApi.init({
            flags: res.locals.cmsFlags,
        }).getFundingProgramme({
            slug: compact([req.params.slug, req.params.child_slug]).join('/'),
            locale: req.i18n.getLocale(),
            searchParams: req.query,
        });

        setCommonLocals(req, res, entry);

        if (entry && entry.entryType === 'contentPage') {
            renderFlexibleContentChild(req, res, entry);
        } else if (get(entry, 'contentSections', []).length > 0) {
            /**
             * Programme Detail page
             */

            if (get(entry, 'area.value') === 'wales') {
                res.locals.showBilingualLogo = true;
            }

            res.render(path.resolve(__dirname, './views/programme'), {
                entry: entry,
                breadcrumbs: res.locals.breadcrumbs.concat({
                    label: res.locals.title,
                }),
            });
        } else if (get(entry, 'isArchived') === true) {
            /**
             * Archived programme
             */
            res.render(path.resolve(__dirname, './views/archived-programme'), {
                entry: entry,
                archiveUrl: buildArchiveUrl(entry.legacyPath),
                breadcrumbs: res.locals.breadcrumbs.concat({
                    label: res.locals.title,
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

router.use(
    '/building-better-opportunities/*',
    (req, res, next) => {
        res.locals.breadcrumbs = res.locals.breadcrumbs.concat({
            label: 'Building Better Opportunities',
            url: localify(req.i18n.getLocale())(
                `/funding/programmes/building-better-opportunities`
            ),
        });
        next();
    },
    flexibleContentPage()
);

module.exports = router;
