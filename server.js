'use strict';
const { forEach } = require('lodash');
const express = require('express');
const favicon = require('serve-favicon');
const path = require('path');
const Raven = require('raven');

const app = express();
module.exports = app;

const appData = require('./modules/appData');

if (appData.isDev) {
    require('dotenv').config();
}

const { SENTRY_DSN } = require('./modules/secrets');
const { cymreigio } = require('./modules/urls');
const viewEngineService = require('./modules/viewEngine');
const viewGlobalsService = require('./modules/viewGlobals');
const { shouldServe } = require('./modules/pageLogic');
const { proxyPassthrough, postToLegacyForm } = require('./modules/legacy');
const { renderError, renderNotFound, renderUnauthorised } = require('./controllers/http-errors');
const { serveRedirects } = require('./modules/redirects');
const routes = require('./controllers/routes');

const { defaultSecurityHeaders, stripCSPHeader } = require('./middleware/securityHeaders');
const { noCache } = require('./middleware/cached');
const bodyParserMiddleware = require('./middleware/bodyParser');
const cachedMiddleware = require('./middleware/cached');
const localesMiddleware = require('./middleware/locales');
const loggerMiddleware = require('./middleware/logger');
const passportMiddleware = require('./middleware/passport');
const previewMiddleware = require('./middleware/preview');
const redirectsMiddleware = require('./middleware/redirects');
const sessionMiddleware = require('./middleware/session');
const timingsMiddleware = require('./middleware/timings');

/**
 * Configure Sentry client
 * @see https://docs.sentry.io/clients/node/config/
 */
Raven.config(SENTRY_DSN, {
    environment: appData.environment,
    autoBreadcrumbs: true,
    dataCallback(data) {
        // Clear installed node_modules
        delete data.modules;
        // Clear POST data
        delete data.request.data;

        return data;
    }
}).install();

app.use(Raven.requestHandler());

/**
 * Status endpoint
 * Mount early to avoid being processed by any middleware
 */
app.get('/status', require('./controllers/toplevel/status'));

/**
 * Static asset paths
 * Mount early to avoid being processed by any middleware
 * @see https://expressjs.com/en/4x/api.html#express.static
 */
app.use(favicon(path.join('public', '/favicon.ico')));
app.use('/assets', express.static(path.join(__dirname, './public')));

/**
 * Define common app locals
 * @see https://expressjs.com/en/api.html#app.locals
 */
function initAppLocals() {
    /**
     * Is this page bilingual?
     * i.e. do we have a Welsh translation
     * Default to true unless overriden by a route
     */
    app.locals.isBilingual = true;

    /**
     * Navigation sections for top-level nav
     */
    app.locals.navigationSections = routes.sections;
}

initAppLocals();

/**
 * Configure views
 */
viewEngineService.init(app);
viewGlobalsService.init(app);

/**
 * Register global middlewares
 */
app.use(timingsMiddleware);
app.use(cachedMiddleware.defaultVary);
app.use(cachedMiddleware.defaultCacheControl);
app.use(loggerMiddleware);
app.use(previewMiddleware);
app.use(defaultSecurityHeaders());
app.use(bodyParserMiddleware);
app.use(sessionMiddleware(app));
app.use(passportMiddleware());
app.use(redirectsMiddleware.common);
app.use(localesMiddleware(app));

// Mount tools controller
app.use('/tools', require('./controllers/tools'));

// Mount apply controller (forms)
app.use(cymreigio('/apply'), require('./controllers/apply'));

// Mount user auth controller
app.use('/user', require('./controllers/user'));

/**
 * Section routes
 * Initialise core application routes
 */
forEach(routes.sections, (section, sectionId) => {
    if (section.controller) {
        const controller = section.controller(section.pages, section.path, sectionId);
        cymreigio(section.path).forEach(urlPath => {
            app.use(urlPath, controller);
        });
    }
});

/**
 * Legacy Redirects
 * Redirecy legacy URLs to new locations
 * For these URLs handle both english and welsh variants
 */
serveRedirects({
    redirects: routes.legacyRedirects.filter(shouldServe),
    makeBilingual: true
});

/**
 * Vanity URLs
 * Sharable short-urls redirected to canonical URLs.
 */
serveRedirects({
    redirects: routes.vanityRedirects.filter(shouldServe)
});

/**
 * Archived Routes
 * Redirect to the National Archvies
 */
routes.archivedRoutes.filter(shouldServe).forEach(route => {
    app.get(cymreigio(route.path), noCache, redirectsMiddleware.redirectArchived);
});

/**
 * Error route
 * Alias for error pages for old site -> new
 */
app.get('/error', (req, res) => {
    renderNotFound(req, res);
});

/**
 * Plain text error route
 * Used for more high-level errors
 */
app.get('/error-unauthorised', (req, res) => {
    renderUnauthorised(req, res);
});

/**
 * Final wildcard request handled
 * Attempt to proxy pages from the legacy site,
 * if unsuccessful pass through to the 404 handler.
 */
app
    .route('*')
    .all(stripCSPHeader)
    .get(proxyPassthrough, redirectsMiddleware.redirectNoWelsh)
    .post(postToLegacyForm);

/**
 * 404 Handler
 * Catch 404s render not found page
 */
app.use((req, res) => {
    renderNotFound(req, res);
});

/**
 * Global error handler
 */
app.use(Raven.errorHandler(), (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    renderError(err, req, res);
});
