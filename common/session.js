'use strict';
const config = require('config');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const { SESSION_SECRET } = require('./secrets');
const { isDev } = require('./appData');
const { sequelize } = require('../db/models');

module.exports = function (app) {
    const store = new SequelizeStore({ db: sequelize });

    /**
     * Create session table
     */
    store.sync();

    /**
     * Configure session
     */
    const sessionConfig = {
        store: store,
        name: config.get('session.cookie'),
        secret: SESSION_SECRET,
        rolling: true,
        resave: false,
        saveUninitialized: false,
        cookie: {
            sameSite: isDev ? false : 'none',
            secure: isDev === false,
            maxAge: config.get('session.expiryInSeconds') * 1000,
        },
    };

    if (isDev === false) {
        // trust the reverse proxy when securing cookies
        app.set('trust proxy', 4);
        sessionConfig.proxy = true;
    }

    return session(sessionConfig);
};
