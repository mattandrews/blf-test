'use strict';
const countBy = require('lodash/countBy');
const find = require('lodash/fp/find');
const flatten = require('lodash/flatten');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const head = require('lodash/fp/head');
const map = require('lodash/fp/map');
const pick = require('lodash/pick');
const sortBy = require('lodash/fp/sortBy');
const uniqBy = require('lodash/uniqBy');

const got = require('got');
const request = require('request-promise-native');
const querystring = require('querystring');

const logger = require('./logger');
const { sanitiseUrlPath, stripTrailingSlashes } = require('./urls');
const { CONTENT_API_URL } = require('./secrets');

const getAttrs = (response) => get('data.attributes')(response);
const mapAttrs = (response) => map('attributes')(response.data);

const queryContentApi = got.extend({
    prefixUrl: CONTENT_API_URL,
    headers: { 'user-agent': 'tnlcf-www' },
    hooks: {
        beforeRequest: [
            function (options) {
                logger.debug(`Fetching ${options.url.href}`);
            },
        ],
    },
});

function fetch(urlPath, options) {
    logger.debug(
        `Fetching ${CONTENT_API_URL}${urlPath}${
            options && options.qs ? '?' + querystring.stringify(options.qs) : ''
        }`
    );

    const defaults = {
        url: `${CONTENT_API_URL}${urlPath}`,
        json: true,
    };
    const params = Object.assign({}, defaults, options);
    return request(params);
}

/**
 * Adds the preview parameters to the request
 * (if accessed via the preview domain)
 */
function withPreviewParams(rawSearchParams = {}, extraSearchParams = {}) {
    const globalParams = pick(rawSearchParams, [
        'social',
        'x-craft-live-preview',
        'x-craft-preview',
        'token',
    ]);
    return Object.assign({}, globalParams, extraSearchParams);
}

/**
 * Merge welsh by property name
 * Merge welsh results where available matched by a given property
 * Usage:
 * ```
 * mergeWelshBy('slug')(currentLocale, enResults, cyResults)
 * ```
 */
function mergeWelshBy(propName) {
    return function (currentLocale, enResults, cyResults) {
        if (currentLocale === 'en') {
            return enResults;
        } else {
            return map((enItem) => {
                const findCy = find(
                    (cyItem) => cyItem[propName] === enItem[propName]
                );
                return findCy(cyResults) || enItem;
            })(enResults);
        }
    };
}

/**
 * Build pagination
 * Translate content API pagination into an object for use in views
 */
function _buildPagination(paginationMeta, currentQuery = {}) {
    if (paginationMeta && paginationMeta.total_pages > 1) {
        const currentPage = paginationMeta.current_page;
        const totalPages = paginationMeta.total_pages;
        const prevLink = `?${querystring.stringify({
            ...currentQuery,
            ...{ page: currentPage - 1 },
        })}`;
        const nextLink = `?${querystring.stringify({
            ...currentQuery,
            ...{ page: currentPage + 1 },
        })}`;

        return {
            count: paginationMeta.count,
            total: paginationMeta.total,
            perPage: paginationMeta.per_page,
            currentPage: currentPage,
            totalPages: totalPages,
            prevLink: currentPage > 1 ? prevLink : null,
            nextLink: currentPage < totalPages ? nextLink : null,
        };
    }
}

/***********************************************
 * API Methods
 ***********************************************/

function getRoutes() {
    return queryContentApi('v1/list-routes').json().then(mapAttrs);
}

function getAliasForLocale(locale, urlPath) {
    return queryContentApi(`v1/${locale}/aliases`)
        .json()
        .then(mapAttrs)
        .then((matches) => {
            return find(function (alias) {
                return alias.from.toLowerCase() === urlPath.toLowerCase();
            })(matches);
        });
}

function getAlias(urlPath) {
    const getOrHomepage = getOr('/', 'to');
    return getAliasForLocale('en', urlPath).then((enMatch) => {
        if (enMatch) {
            return getOrHomepage(enMatch);
        } else {
            return getAliasForLocale('cy', urlPath).then((cyMatch) =>
                cyMatch ? getOrHomepage(cyMatch) : null
            );
        }
    });
}

function getHeroImage({ locale, slug }) {
    return queryContentApi(`v1/${locale}/hero-image/${slug}`)
        .json()
        .then(getAttrs);
}

function getHomepage(locale, searchParams = {}) {
    return queryContentApi(`v1/${locale}/homepage`, {
        searchParams: withPreviewParams(searchParams),
    })
        .json()
        .then(getAttrs);
}

/**
 * Get updates
 * @param options
 * @property {string} options.locale
 * @property {string} [options.type]
 * @property {string} [options.date]
 * @property {string} [options.slug]
 * @property {object} [options.query]
 * @property {object} [options.requestParams]
 */
function getUpdates({
    locale,
    type = null,
    date = null,
    slug = null,
    query = {},
    requestParams = {},
}) {
    if (slug) {
        return queryContentApi(`v1/${locale}/updates/${type}/${date}/${slug}`, {
            searchParams: withPreviewParams(requestParams, { ...query }),
        })
            .json()
            .then((response) => {
                return {
                    meta: response.meta,
                    result: response.data.attributes,
                };
            });
    } else {
        return queryContentApi(`/v1/${locale}/updates/${type || ''}`, {
            searchParams: withPreviewParams(requestParams, {
                ...query,
                ...{ 'page-limit': 10 },
            }),
        })
            .json()
            .then((response) => {
                return {
                    meta: response.meta,
                    result: mapAttrs(response),
                    pagination: _buildPagination(
                        response.meta.pagination,
                        query
                    ),
                };
            });
    }
}

function getFundingProgrammes({
    locale,
    page = 1,
    pageLimit = 100,
    showAll = false,
}) {
    const requestOptions = {
        searchParams: {
            'page': page,
            'page-limit': pageLimit,
            'all': showAll === true,
        },
    };

    return Promise.all([
        queryContentApi.get('v2/en/funding-programmes', requestOptions).json(),
        queryContentApi.get('v2/cy/funding-programmes', requestOptions).json(),
    ]).then((responses) => {
        const [enResults, cyResults] = responses.map(mapAttrs);
        return {
            meta: head(responses).meta,
            result: mergeWelshBy('slug')(locale, enResults, cyResults),
        };
    });
}

function getRecentFundingProgrammes(locale) {
    return queryContentApi
        .get(`v2/${locale}/funding-programmes`, {
            searchParams: { 'page': 1, 'page-limit': 3, 'newest': true },
        })
        .json()
        .then(mapAttrs);
}

function getFundingProgramme({ locale, slug, searchParams = {} }) {
    return queryContentApi
        .get(`v2/${locale}/funding-programmes/${slug}`, {
            searchParams: withPreviewParams(searchParams),
        })
        .json()
        .then(getAttrs);
}

function getResearch({
    locale,
    slug = null,
    query = {},
    requestParams = {},
    type = null,
}) {
    if (slug) {
        return queryContentApi(`/v1/${locale}/research/${slug}`, {
            searchParams: withPreviewParams(requestParams, { ...query }),
        })
            .json()
            .then(getAttrs);
    } else {
        let path = `/v1/${locale}/research`;
        if (type) {
            path += `/${type}`;
        }
        return queryContentApi(path, {
            searchParams: withPreviewParams(requestParams, { ...query }),
        })
            .json()
            .then((response) => {
                return {
                    meta: response.meta,
                    result: mapAttrs(response),
                    pagination: _buildPagination(
                        response.meta.pagination,
                        query
                    ),
                };
            });
    }
}

function getPublications({
    locale,
    programme,
    slug = null,
    requestParams = {},
}) {
    const filteredRequestParams = pick(requestParams, [
        'page',
        'tag',
        'q',
        'sort',
    ]);

    const apiRequestParams = {
        // Override default page-limit
        ...{ 'page-limit': 10 },
        ...filteredRequestParams,
    };

    const baseUrl = `/v1/${locale}/funding/publications/${programme}`;
    if (slug) {
        return fetch(`${baseUrl}/${slug}`, {
            qs: withPreviewParams(requestParams, { ...apiRequestParams }),
        }).then((response) => {
            return {
                meta: response.meta,
                entry: getAttrs(response),
            };
        });
    } else {
        return fetch(baseUrl, {
            qs: withPreviewParams(requestParams, { ...apiRequestParams }),
        }).then((response) => {
            return {
                meta: response.meta,
                result: mapAttrs(response),
                pagination: _buildPagination(
                    response.meta.pagination,
                    apiRequestParams
                ),
            };
        });
    }
}

function getPublicationTags({ locale, programme }) {
    return fetch(`/v1/${locale}/funding/publications/${programme}/tags`).then(
        (response) => {
            const attrs = mapAttrs(response);
            // Strip entries to just their tags
            const allTags = flatten(attrs.map((_) => _.tags));
            // Count the occurrences of each tag
            const counts = countBy(allTags, 'id');
            // Merge these counts into the tag list after de-duping
            const tags = uniqBy(allTags, 'id').map((tag) => {
                tag.count = counts[tag.id];
                return tag;
            });
            return sortBy('count')(tags).reverse();
        }
    );
}

function getStrategicProgrammes({
    locale,
    slug = null,
    query = {},
    requestParams = {},
}) {
    if (slug) {
        return queryContentApi
            .get(`v1/${locale}/strategic-programmes/${slug}`, {
                searchParams: withPreviewParams(requestParams, { ...query }),
            })
            .json()
            .then((response) => get('data.attributes')(response));
    } else {
        return Promise.all([
            queryContentApi.get('v1/en/strategic-programmes').json(),
            queryContentApi.get('v1/cy/strategic-programmes').json(),
        ]).then((responses) => {
            const [enResults, cyResults] = responses.map(mapAttrs);
            return mergeWelshBy('urlPath')(locale, enResults, cyResults);
        });
    }
}

function getListingPage({ locale, path, query = {}, requestParams = {} }) {
    const sanitisedPath = sanitiseUrlPath(path);
    return fetch(`/v1/${locale}/listing`, {
        qs: withPreviewParams(requestParams, {
            ...query,
            ...{ path: sanitisedPath },
        }),
    }).then((response) => {
        const attributes = response.data.map((item) => item.attributes);
        // @TODO remove the check for attr.path, which will shortly be removed the CMS
        return attributes.find((attr) => {
            if (get(attr, 'path')) {
                return attr.path === sanitisedPath;
            } else {
                return attr.linkUrl === stripTrailingSlashes(path);
            }
        });
    });
}

function getFlexibleContent({ locale, path, query = {}, requestParams = {} }) {
    const sanitisedPath = sanitiseUrlPath(path);
    return queryContentApi(`v1/${locale}/flexible-content`, {
        searchParams: withPreviewParams(requestParams, {
            ...query,
            ...{ path: sanitisedPath },
        }),
    })
        .json()
        .then(getAttrs);
}

function getProjectStory({ locale, grantId, query = {}, requestParams = {} }) {
    return fetch(`/v1/${locale}/project-stories/${grantId}`, {
        qs: withPreviewParams(requestParams, { ...query }),
    }).then(getAttrs);
}

function getOurPeople(locale, searchParams = {}) {
    return queryContentApi(`v1/${locale}/our-people`, {
        searchParams: withPreviewParams(searchParams),
    })
        .json()
        .then(mapAttrs);
}

function getDataStats(locale, searchParams = {}) {
    return queryContentApi(`v1/${locale}/data`, {
        searchParams: withPreviewParams(searchParams),
    })
        .json()
        .then(getAttrs);
}

function getMerchandise({ locale, showAll = false } = {}) {
    let searchParams = {};
    if (showAll) {
        searchParams.all = 'true';
    }

    return queryContentApi(`v1/${locale}/merchandise`, {
        searchParams: searchParams,
    })
        .json()
        .then(mapAttrs);
}

module.exports = {
    // Exported for tests
    _buildPagination,
    // API methods
    getAlias,
    getProjectStory,
    getDataStats,
    getFlexibleContent,
    getFundingProgramme,
    getFundingProgrammes,
    getRecentFundingProgrammes,
    getHeroImage,
    getHomepage,
    getListingPage,
    getMerchandise,
    getOurPeople,
    getPublications,
    getPublicationTags,
    getResearch,
    getRoutes,
    getStrategicProgrammes,
    getUpdates,
};
