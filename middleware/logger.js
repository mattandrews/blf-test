'use strict';
const morgan = require('morgan');

const skipLogs = !!process.env.TEST_SERVER === true;

module.exports = morgan(
    '[:date[clf]] :method :url HTTP/:http-version :status :res[content-length] - :response-time ms ":referrer"',
    { skip: () => skipLogs }
);
