'use strict';
const express = require('express');

const appData = require('../../modules/appData');
const { initFormRouter } = require('./form-router');

const { formBuilder } = require('./simple/form-model');
const processor = require('./simple/processor');

const router = express.Router();

if (appData.isNotProduction) {
    router.get('/', (req, res) => res.redirect('/'));

    router.use(
        '/simple',
        initFormRouter({
            id: 'awards-for-all',
            formBuilder: formBuilder,
            processor: processor
        })
    );
}

module.exports = router;
