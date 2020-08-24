'use strict';
const getOr = require('lodash/fp/getOr');
const { ContentApiClient } = require('../common/content-api');

const ContentApi = new ContentApiClient();

/**
 * Lookup URL path in CMS to check for redirect status there
 */
module.exports = async function (req, res, next) {
    try {
        const urlMatch = await ContentApi.init({
            flags: res.locals.cmsFlags,
        }).getRedirect(req.path);

        const destination = getOr(false, 'destination')(urlMatch);
        if (destination) {
            res.redirect(301, destination);
        } else {
            next();
        }
    } catch (e) {
        next();
    }
};
