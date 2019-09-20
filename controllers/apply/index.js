'use strict';
const express = require('express');
const { isDev } = require('../../common/appData');

const router = express.Router();

router.get('/', (req, res) => res.redirect('/'));

router.use('/your-idea', require('./reaching-communities'));
router.use('/awards-for-all', require('./awards-for-all'));

if (isDev) {
    router.use('/get-advice', require('./get-advice'));
}

module.exports = router;
