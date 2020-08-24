/* eslint-env jest */
// @ts-nocheck
'use strict';
const fs = require('fs');
const path = require('path');

function validateSchemaDocumentation(formBuilder, schemaDocPath) {
    const form = formBuilder();

    const docContents = fs.readFileSync(schemaDocPath, 'utf8');

    describe(`${form.title} schema documentation`, function () {
        test.each(Object.keys(form.schema.describe().keys))(
            '%s has documentation entry',
            (fieldName) => {
                const fieldNameRegexp = new RegExp(`### ${fieldName}`);
                const match = fieldNameRegexp.test(docContents);
                expect(match).toBeTruthy();
            }
        );
    });
}

validateSchemaDocumentation(
    require('../../controllers/apply/under10k/form'),
    path.resolve(__dirname, '../application-forms/under10k/schema.md')
);

validateSchemaDocumentation(
    require('../../controllers/apply/standard-proposal/form'),
    path.resolve(__dirname, '../application-forms/standard-proposal/schema.md')
);
