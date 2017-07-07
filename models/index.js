'use strict';
const Sequelize = require('sequelize');
const config = require('config');
const secrets = require('../modules/secrets');

let db = {};

let dbCredentials = {
    host: secrets['mysql.host'],
    user: secrets['mysql.user'],
    pass: secrets['mysql.password']
};

const sequelize = new Sequelize(config.get('database'), dbCredentials.user, dbCredentials.pass, {
    host: dbCredentials.host,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
});

sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
})
.catch(err => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
});

// add models
db.News = sequelize.import('../models/news.js');

// add model associations (eg. for joins etc)
Object.keys(db).forEach((modelName) => {
    if ("associate" in db[modelName]) {
        db[modelName].associate(db);
    }
});

// allow access to DB instance and sequelize API
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;