/* eslint-env jest */
'use strict';
const {getNoticesSingle } = require('./notices');


test.each(['school', 'college-or-university', 'statutory-body'])(
    'get notices for under £10,000 application in England for %p',
    function (orgType) {
        const resultSingle = getNoticesSingle('en', {
            formId: 'awards-for-all',
            applicationData: {
                projectCountry: 'england',
                organisationType: orgType,
            },
        });
        expect(resultSingle).toMatchSnapshot();
        expect(resultSingle).toHaveLength(1);
    }
);
