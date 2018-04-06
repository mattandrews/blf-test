const fs = require('fs');
const path = require('path');
const config = require('config');

// load cachebusted assets
let assets = {};
try {
    assets = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/assets.json'), 'utf8'));
} catch (e) {} // eslint-disable-line no-empty

const CURRENT_VERSION = assets.version || 'latest';
const ASSET_VIRTUAL_DIR = config.get('assetVirtualDir');
const USE_REMOTE_ASSETS = config.get('features.useRemoteAssets');

function getCachebustedPath(urlPath) {
    const baseUrl = USE_REMOTE_ASSETS ? 'https://media.biglotteryfund.org.uk' : `/${ASSET_VIRTUAL_DIR}`;
    return `${baseUrl}/build/${CURRENT_VERSION}/${urlPath}`;
}

function getCachebustedRealPath(urlPath) {
    return `/build/${CURRENT_VERSION}/${urlPath}`;
}

function getImagePath(urlPath) {
    if (/^http(s?):\/\//.test(urlPath)) {
        return urlPath;
    } else {
        return `/${ASSET_VIRTUAL_DIR}/images/${urlPath}`;
    }
}

module.exports = {
    getCachebustedPath: getCachebustedPath,
    getCachebustedRealPath: getCachebustedRealPath,
    getImagePath: getImagePath
};
