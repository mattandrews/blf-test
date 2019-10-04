'use strict';
const { URL } = require('url');
const querystring = require('querystring');

const WELSH_REGEX = /^\/welsh(\/|$)/;

/**
 * isWelsh
 * Is the current URL a welsh URL
 */
function isWelsh(urlPath) {
    return urlPath.match(WELSH_REGEX) !== null;
}

/**
 * makeWelsh
 * Create a welsh version of a given URL path
 */
function makeWelsh(urlPath) {
    return `/welsh${urlPath}`;
}

/**
 * removeWelsh
 * Opposite of makeWelsh
 */
function removeWelsh(urlPath) {
    return urlPath.replace(WELSH_REGEX, '/');
}

/**
 * localify
 * Rewrite urlPath into the current locale
 */
function localify(locale) {
    return function(urlPath) {
        const urlIsWelsh = isWelsh(urlPath);

        let newUrlPath = urlPath;
        if (locale === 'cy' && !urlIsWelsh) {
            newUrlPath = makeWelsh(urlPath);
        } else if (locale === 'en' && urlIsWelsh) {
            newUrlPath = urlPath.replace(WELSH_REGEX, '/');
        }
        return stripTrailingSlashes(newUrlPath);
    };
}

/**
 * Test if a path could be an alias
 * i.e. more than one level deep
 * @param path
 * @returns {boolean}
 */
function pathCouldBeAlias(path) {
    return (path[0] === '/' ? path.substring(1) : path).split('/').length === 1;
}

function getBaseUrl(req) {
    const headerProtocol = req.get('X-Forwarded-Proto');
    const protocol = headerProtocol ? headerProtocol : req.protocol;
    return `${protocol}://${req.get('host')}`;
}

function getAbsoluteUrl(req, urlPath) {
    if (urlPath.indexOf('://') === -1) {
        const baseUrl = getBaseUrl(req);
        return `${baseUrl}${urlPath}`;
    } else {
        return urlPath;
    }
}

/**
 * hasTrailingSlash
 * Does a given URL end with a trailing slash
 */
function hasTrailingSlash(urlPath) {
    return urlPath[urlPath.length - 1] === '/' && urlPath.length > 1;
}

/**
 * Strip trailing slashes from a string
 * Used to strip slashes from URLs like '/welsh/' => '/welsh'
 */
function stripTrailingSlashes(urlPath) {
    if (hasTrailingSlash(urlPath)) {
        urlPath = urlPath.substring(0, urlPath.length - 1);
    }

    return urlPath;
}

/**
 * Sanitise URL path
 * Strip welsh + any preceding or trailing slashes,
 * leaving plain URL slug. e.g. /welsh/about/ => about
 */
function sanitiseUrlPath(urlPath) {
    return stripTrailingSlashes(removeWelsh(urlPath).replace(/^\/+/g, ''));
}

/**
 * getCurrentUrl
 * - Look up the current URL and rewrite to another locale
 * - Normalises and prunes query strings
 */
function getCurrentUrl(req, requestedLocale) {
    const urlPath = req.originalUrl;
    const baseUrl = getBaseUrl(req);

    const isCurrentUrlWelsh = isWelsh(urlPath);
    const isCyWithEnRequested = isCurrentUrlWelsh && requestedLocale === 'en';
    const isEnWithCyRequested = !isCurrentUrlWelsh && requestedLocale === 'cy';

    // Rewrite URL to requested language
    let urlPathForRequestedLocale = urlPath;
    if (isEnWithCyRequested) {
        urlPathForRequestedLocale = makeWelsh(urlPath);
    } else if (isCyWithEnRequested) {
        urlPathForRequestedLocale = removeWelsh(urlPath);
    }

    // Remove any trailing slashes (eg. /welsh/ => /welsh)
    const cleanedUrlPath = stripTrailingSlashes(urlPathForRequestedLocale);

    const fullUrl = baseUrl + cleanedUrlPath;

    const parsedUrl = new URL(fullUrl);
    const parsedPathname = parsedUrl.pathname;
    const parsedQuery = parsedUrl.search.replace(/^\?/, '');

    // Remove CMS preview parameters
    const originalQuery = querystring.parse(parsedQuery);
    delete originalQuery.token;
    delete originalQuery['x-craft-live-preview'];
    delete originalQuery['x-craft-preview'];

    // Reconstruct clean URL
    const newCleanQuery = querystring.stringify(originalQuery);
    return newCleanQuery.length > 0
        ? `${parsedPathname}?${newCleanQuery}`
        : parsedPathname;
}

function redirectForLocale(req, res, urlPath) {
    const url = localify(req.i18n.getLocale())(urlPath);
    res.redirect(url);
}

module.exports = {
    getAbsoluteUrl,
    getBaseUrl,
    getCurrentUrl,
    hasTrailingSlash,
    isWelsh,
    localify,
    makeWelsh,
    pathCouldBeAlias,
    redirectForLocale,
    removeWelsh,
    sanitiseUrlPath,
    stripTrailingSlashes
};
