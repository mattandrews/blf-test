'use strict';
const path = require('path');
const express = require('express');
const i18n = require('i18n-2');
const yaml = require('js-yaml');
const nunjucks = require('nunjucks');
const cacheControl = require('express-cache-controller');
const favicon = require('serve-favicon');
const helmet = require('helmet');
const slashes = require('connect-slashes');
const vary = require('vary');
const Sentry = require('@sentry/node');
const forEach = require('lodash/forEach');

const app = express();
module.exports = app;

const appData = require('./common/appData');
const { SENTRY_DSN } = require('./common/secrets');
const { localify } = require('./common/urls');
const { defaultMaxAge, noStore, sMaxAge } = require('./common/cached');
const cspDirectives = require('./common/csp-directives');
const logger = require('./common/logger').child({ service: 'server' });

const { renderError, renderNotFound } = require('./controllers/errors');

/**
 * Configure Sentry client
 * @see https://docs.sentry.io/platforms/node/express/
 */
Sentry.init({
    dsn: SENTRY_DSN,
    logger: 'server',
    environment: appData.environment,
    release: `tnlcf-web-${appData.commitId}`,
    beforeSend: function (event) {
        // Clear all POST data
        delete event.request.data;
        return event;
    },
});

/**
 * The Sentry request handler must be the first middleware
 */
app.use(Sentry.Handlers.requestHandler());

/**
 * Set up internationalisation
 */
i18n.expressBind(app, {
    locales: ['en', 'cy'],
    directory: './config/locales',
    extension: '.yml',
    parse: (data) => yaml.safeLoad(data),
    dump: (data) => yaml.safeDump(data),
    devMode: false,
});

/**
 * Domain redirects
 * Redirect requests from any non-canonical domains
 */
app.use(require('./controllers/domain-redirect'));

/**
 * Single endpoints
 * Mount first before any common middleware
 */
app.get('/status', noStore, require('./controllers/status'));
app.get('/robots.txt', noStore, require('./controllers/robots'));
app.get('/sitemap.xml', sMaxAge(1800), require('./controllers/sitemap'));
app.get('/search', noStore, require('./controllers/search'));

/**
 * Static asset paths
 * Mount early to avoid being processed by any middleware
 * @see https://expressjs.com/en/4x/api.html#express.static
 */
app.use(favicon(path.join('public', '/favicon.ico')));
app.use('/assets', express.static(path.join(__dirname, './public')));

/**
 * Configure views
 * 1. Configure Nunjucks
 * 2. Add custom filters
 * 3. Add custom view globals
 */
function initViewEngine() {
    /**
     * Only watch files if we explicitly request
     * (eg. for CI, which tries to watch node_modules)
     */
    const shouldWatchTemplates = !!process.env.WATCH_TEMPLATES === true;
    if (shouldWatchTemplates) {
        logger.debug('Watching templates for changes');
    }

    const templateEnv = nunjucks.configure(['.', 'views'], {
        autoescape: true,
        express: app,
        noCache: true, // Disable nunjucks memory cache
        watch: shouldWatchTemplates,
    });

    forEach(require('./views/filters'), (filterFn, filterName) => {
        templateEnv.addFilter(filterName, filterFn);
    });

    app.set('view engine', 'njk').set('engineEnv', templateEnv);

    // Disable express  view cache
    app.disable('view cache');
}

initViewEngine();

/**
 * Register global middleware
 */
app.use([
    slashes(false),
    (req, res, next) => {
        vary(res, 'Cookie');
        next();
    },
    cacheControl(),
    defaultMaxAge,
    helmet({
        contentSecurityPolicy: {
            directives: cspDirectives(),
        },
        dnsPrefetchControl: { allow: true },
        frameguard: { action: 'sameorigin' },
        permittedCrossDomainPolicies: {
            permittedPolicies: 'none',
        },
        referrerPolicy: {
            policy: 'no-referrer-when-downgrade',
        },
    }),
    express.json(),
    express.urlencoded({ extended: true }),
    require('./common/session')(app),
    require('./common/passport')(),
    require('./common/locals'),
    require('./common/preview-auth'),
]);

/**
 * Non-localised routers
 * Mount routers that don't need localising (internal use only)
 */
app.use('/api', require('./controllers/api'));
app.use('/tools', require('./controllers/tools'));
app.use('/patterns', require('./controllers/pattern-library'));

/**
 * Homepage handler
 * Mount as a one-off GET route in both English and Welsh
 */
app.get('/', require('./controllers/home'));
app.get('/welsh', require('./controllers/home'));

/**
 * Handle archived paths:
 * - Legacy redirects
 * - National Archives content
 * - Archived media
 */
app.use('/', require('./controllers/archived'));

/**
 * Initialise section routers
 */
const sections = {
    funding: {
        path: '/funding',
        router: require('./controllers/funding'),
    },
    insights: {
        path: '/insights',
        router: require('./controllers/insights'),
    },
    about: {
        path: '/about',
        router: require('./controllers/about'),
    },
    updates: {
        path: '/news',
        router: require('./controllers/updates'),
    },
    data: {
        path: '/data',
        router: require('./controllers/data'),
    },
    user: {
        path: '/user',
        router: require('./controllers/user'),
    },
    apply: {
        path: '/apply',
        router: require('./controllers/apply'),
    },
};

forEach(sections, function (section, sectionId) {
    /**
     * Add section locals
     * Used for determining top-level section for navigation and breadcrumbs
     */
    function sectionLocals(req, res, next) {
        const sectionTitle = req.i18n.__(`global.nav.${sectionId}`);
        const sectionUrl = localify(req.i18n.getLocale())(req.baseUrl || '/');

        res.locals.sectionTitle = sectionTitle;
        res.locals.sectionUrl = sectionUrl;

        /**
         * Set top-level breadcrumb for current section
         */
        res.locals.breadcrumbs = [{ label: sectionTitle, url: sectionUrl }];

        next();
    }

    /**
     * Mount each section under both English and Welsh paths.
     */
    app.use(section.path, sectionLocals, section.router);
    app.use(`/welsh${section.path}`, sectionLocals, section.router);
});

/**
 * Final wildcard request handler
 * - Lookup vanity URL and redirect if we have a match
 * - Then check whether this is a redirect defined by the CMS
 * - Otherwise, if the URL is welsh, strip that from the URL and try again
 * - If all else fails, pass through to the 404 handler.
 */
app.route('*').get(
    require('./controllers/vanity-redirects'),
    require('./controllers/cms-redirects'),
    require('./controllers/welsh-redirect')
);

/**
 * 404 Handler
 * Catch 404s render not found page
 */
app.use(renderNotFound);

/**
 * Global error handler
 */
app.use(Sentry.Handlers.errorHandler(), function (err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    renderError(err, req, res);
});
