/* eslint-env jest */
'use strict';

const httpMocks = require('node-mocks-http');
const redirectsMiddleware = require('../redirects');
const config = require('config');
const domains = config.get('domains');

describe('redirects', () => {
    it('should redirect on non www production domain ', () => {
        const req = httpMocks.createRequest({
            headers: {
                Host: domains.host
            }
        });
        const res = httpMocks.createResponse();
        redirectsMiddleware(req, res, () => {});
        expect(res.statusCode).toBe(301);
    });

    it('should not redirect on www production domain ', () => {
        const req = httpMocks.createRequest({
            headers: {
                Host: domains.www
            }
        });
        const res = httpMocks.createResponse();
        redirectsMiddleware(req, res, () => {});
        expect(res.statusCode).toBe(200);
    });
});
