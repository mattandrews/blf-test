'use strict';
const countBy = require('lodash/countBy');
const find = require('lodash/fp/find');
const flatten = require('lodash/flatten');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const map = require('lodash/fp/map');
const pick = require('lodash/pick');
const sortBy = require('lodash/fp/sortBy');
const uniqBy = require('lodash/uniqBy');

const got = require('got');
const querystring = require('querystring');

const logger = require('./logger');
const { sanitiseUrlPath, stripTrailingSlashes } = require('./urls');
const { CONTENT_API_URL, CONTENT_API_SANDBOX_URL } = require('./secrets');

const getAttrs = (response) => get('data.attributes')(response);
const mapAttrs = (response) => map('attributes')(response.data);

class ContentApiClient {
    constructor() {
        this.API_ENDPOINT = CONTENT_API_URL;
        this.queryContentApi = null;
    }

    // Configure any per-request options for this call
    // (eg. pass through `flags.sandboxMode` boolean to call the test CMS endpoint)
    init(options = {}) {
        this.API_ENDPOINT =
            get('flags.sandboxMode')(options) === true
                ? CONTENT_API_SANDBOX_URL
                : CONTENT_API_URL;

        this.queryContentApi = got.extend({
            prefixUrl: this.API_ENDPOINT,
            headers: { 'user-agent': 'tnlcf-www' },
            hooks: {
                beforeRequest: [
                    function (options) {
                        logger.debug(`Fetching ${options.url.href}`);
                    },
                ],
            },
        });

        return this;
    }

    /**
     * Adds the preview parameters to the request
     * (if accessed via the preview domain)
     */
    withPreviewParams(rawSearchParams = {}, extraSearchParams = {}) {
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
    mergeWelshBy(propName) {
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
    _buildPagination(paginationMeta, currentQuery = {}) {
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

    getRoutes() {
        return this.queryContentApi('v1/list-routes').json().then(mapAttrs);
    }

    getAliasForLocale(locale, urlPath) {
        return this.queryContentApi(`v1/${locale}/aliases`)
            .json()
            .then(mapAttrs)
            .then((matches) => {
                return find(function (alias) {
                    return alias.from.toLowerCase() === urlPath.toLowerCase();
                })(matches);
            });
    }

    getAlias(urlPath) {
        const getOrHomepage = getOr('/', 'to');
        return this.getAliasForLocale('en', urlPath).then((enMatch) => {
            if (enMatch) {
                return getOrHomepage(enMatch);
            } else {
                return this.getAliasForLocale('cy', urlPath).then((cyMatch) =>
                    cyMatch ? getOrHomepage(cyMatch) : null
                );
            }
        });
    }

    getRedirect(urlPath) {
        return this.queryContentApi
            .get(`v1/en/redirect`, {
                searchParams: { path: urlPath },
            })
            .json()
            .then(getAttrs);
    }

    getHeroImage({ locale, slug }) {
        return this.queryContentApi(`v1/${locale}/hero-image/${slug}`)
            .json()
            .then(getAttrs);
    }

    getHomepage(locale, searchParams = {}) {
        return this.queryContentApi(`v1/${locale}/homepage`, {
            searchParams: this.withPreviewParams(searchParams),
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
    getUpdates({
        locale,
        type = null,
        date = null,
        slug = null,
        query = {},
        requestParams = {},
    }) {
        if (slug) {
            return this.queryContentApi(
                `v1/${locale}/updates/${type}/${date}/${slug}`,
                {
                    searchParams: this.withPreviewParams(requestParams, {
                        ...query,
                    }),
                }
            )
                .json()
                .then((response) => {
                    return {
                        meta: response.meta,
                        result: response.data.attributes,
                    };
                });
        } else {
            return this.queryContentApi(`v1/${locale}/updates/${type || ''}`, {
                searchParams: this.withPreviewParams(requestParams, {
                    ...query,
                    ...{ 'page-limit': 10 },
                }),
            })
                .json()
                .then((response) => {
                    return {
                        meta: response.meta,
                        result: mapAttrs(response),
                        pagination: this._buildPagination(
                            response.meta.pagination,
                            query
                        ),
                    };
                });
        }
    }

    getFundingProgrammes({
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
            this.queryContentApi
                .get('v2/en/funding-programmes', requestOptions)
                .json(),
            this.queryContentApi
                .get('v2/cy/funding-programmes', requestOptions)
                .json(),
        ]).then((responses) => {
            const [enResponse, cyResponse] = responses;
            return {
                meta: locale === 'en' ? enResponse.meta : cyResponse.meta,
                result: this.mergeWelshBy('slug')(
                    locale,
                    mapAttrs(enResponse),
                    mapAttrs(cyResponse)
                ),
            };
        });
    }

    getRecentFundingProgrammes(locale) {
        return this.queryContentApi
            .get(`v2/${locale}/funding-programmes`, {
                searchParams: { 'page': 1, 'page-limit': 3, 'newest': true },
            })
            .json()
            .then(mapAttrs);
    }

    getFundingProgramme({ locale, slug, searchParams = {} }) {
        return this.queryContentApi
            .get(`v2/${locale}/funding-programmes/${slug}`, {
                searchParams: this.withPreviewParams(searchParams),
            })
            .json()
            .then(getAttrs);
    }

    getResearch({
        locale,
        slug = null,
        query = {},
        requestParams = {},
        type = null,
    }) {
        if (slug) {
            return this.queryContentApi(`v1/${locale}/research/${slug}`, {
                searchParams: this.withPreviewParams(requestParams, {
                    ...query,
                }),
            })
                .json()
                .then(getAttrs);
        } else {
            let path = `v1/${locale}/research`;
            if (type) {
                path += `/${type}`;
            }
            return this.queryContentApi(path, {
                searchParams: this.withPreviewParams(requestParams, {
                    ...query,
                }),
            })
                .json()
                .then((response) => {
                    return {
                        meta: response.meta,
                        result: mapAttrs(response),
                        pagination: this._buildPagination(
                            response.meta.pagination,
                            query
                        ),
                    };
                });
        }
    }

    getPublications({ locale, programme, slug = null, searchParams = {} }) {
        const customSearchParams = {
            // Override default page-limit
            ...{ 'page-limit': 10 },
            ...pick(searchParams, ['page', 'tag', 'q', 'sort']),
        };

        const combinedSearchParams = this.withPreviewParams(searchParams, {
            ...customSearchParams,
        });

        if (slug) {
            return this.queryContentApi(
                `v1/${locale}/funding/publications/${programme}/${slug}`,
                { searchParams: combinedSearchParams }
            )
                .json()
                .then((response) => {
                    return {
                        meta: response.meta,
                        entry: getAttrs(response),
                    };
                });
        } else {
            return this.queryContentApi(
                `v1/${locale}/funding/publications/${programme}`,
                { searchParams: combinedSearchParams }
            )
                .json()
                .then((response) => {
                    return {
                        meta: response.meta,
                        result: mapAttrs(response),
                        pagination: this._buildPagination(
                            response.meta.pagination,
                            customSearchParams
                        ),
                    };
                });
        }
    }

    getPublicationTags({ locale, programme }) {
        return this.queryContentApi(
            `v1/${locale}/funding/publications/${programme}/tags`
        )
            .json()
            .then(function (response) {
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
            });
    }

    getStrategicProgrammes({
        locale,
        slug = null,
        query = {},
        requestParams = {},
    }) {
        if (slug) {
            return this.queryContentApi
                .get(`v1/${locale}/strategic-programmes/${slug}`, {
                    searchParams: this.withPreviewParams(requestParams, {
                        ...query,
                    }),
                })
                .json()
                .then((response) => get('data.attributes')(response));
        } else {
            return Promise.all([
                this.queryContentApi.get('v1/en/strategic-programmes').json(),
                this.queryContentApi.get('v1/cy/strategic-programmes').json(),
            ]).then((responses) => {
                const [enResults, cyResults] = responses.map(mapAttrs);
                return this.mergeWelshBy('urlPath')(
                    locale,
                    enResults,
                    cyResults
                );
            });
        }
    }

    getListingPage({ locale, path, query = {}, requestParams = {} }) {
        const sanitisedPath = sanitiseUrlPath(path);
        return this.queryContentApi(`v1/${locale}/listing`, {
            searchParams: this.withPreviewParams(requestParams, {
                ...query,
                ...{ path: sanitisedPath },
            }),
        })
            .json()
            .then((response) => {
                const attributes = response.data.map((item) => item.attributes);
                return attributes.find((attr) => {
                    return attr.linkUrl === stripTrailingSlashes(path);
                });
            });
    }

    getProjectStory({ locale, grantId, query = {}, requestParams = {} }) {
        return this.queryContentApi(`v1/${locale}/project-stories/${grantId}`, {
            searchParams: this.withPreviewParams(requestParams, { ...query }),
        })
            .json()
            .then(getAttrs);
    }

    getDataStats(locale, searchParams = {}) {
        return this.queryContentApi(`v1/${locale}/data`, {
            searchParams: this.withPreviewParams(searchParams),
        })
            .json()
            .then(getAttrs);
    }

    getMerchandise({ locale, showAll = false } = {}) {
        let searchParams = {};
        if (showAll) {
            searchParams.all = 'true';
        }

        return this.queryContentApi(`v1/${locale}/merchandise`, {
            searchParams: searchParams,
        })
            .json()
            .then(mapAttrs);
    }
}

module.exports = { ContentApiClient };
