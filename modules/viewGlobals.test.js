/* global describe, it */

const chai = require('chai');
const expect = chai.expect;

const httpMocks = require('node-mocks-http');
const { buildUrl, getCurrentUrl, getMetaTitle, getCurrentSection } = require('./viewGlobals');

describe('View Globals', () => {
    describe('#buildUrl', () => {
        it('should build correct url based on section url and page name', () => {
            const builderEn = buildUrl('');
            const builderCy = buildUrl('welsh');

            expect(builderEn('toplevel', 'benefits')).to.equal('/jobs/benefits');
            expect(builderCy('toplevel', 'benefits')).to.equal('welsh/jobs/benefits');
        });

        it('should build correct url when a simple path is given', () => {
            const testPath = 'global-content/programmes/england/awards-for-all-england';
            expect(buildUrl('')(testPath)).to.equal(`/${testPath}`);
            expect(buildUrl('welsh')(testPath)).to.equal(`welsh/${testPath}`);
        });
    });

    describe('#getCurrentUrl', () => {
        it('should return expected url for en locale', () => {
            const req = httpMocks.createRequest({
                method: 'GET',
                url: '/some/example/url/',
                headers: {
                    Host: 'biglotteryfund.org.uk',
                    'X-Forwarded-Proto': 'https'
                }
            });
            expect(getCurrentUrl(req, 'en')).to.equal('/some/example/url');
            expect(getCurrentUrl(req, 'cy')).to.equal('/welsh/some/example/url');
        });

        it('should correct url if in cy locale', () => {
            const req = httpMocks.createRequest({
                method: 'GET',
                url: '/welsh/some/example/url/',
                headers: {
                    Host: 'biglotteryfund.org.uk',
                    'X-Forwarded-Proto': 'https'
                }
            });

            expect(getCurrentUrl(req, 'en')).to.equal('/some/example/url');
            expect(getCurrentUrl(req, 'cy')).to.equal('/welsh/some/example/url');
        });

        it('should strip version and draft query parameters', () => {
            function withQuery(query) {
                return httpMocks.createRequest({
                    method: 'GET',
                    url: `/some/example/url?${query}`,
                    headers: {
                        Host: 'biglotteryfund.org.uk',
                        'X-Forwarded-Proto': 'https'
                    }
                });
            }
            expect(getCurrentUrl(withQuery('version=123'))).to.equal('/some/example/url');
            expect(getCurrentUrl(withQuery('draft=123'))).to.equal('/some/example/url');
            expect(getCurrentUrl(withQuery('version=123&something=else'))).to.equal('/some/example/url?something=else');
            expect(getCurrentUrl(withQuery('draft=2&something=else'))).to.equal('/some/example/url?something=else');
            expect(getCurrentUrl(withQuery('version=123&draft=2&something=else'))).to.equal(
                '/some/example/url?something=else'
            );
        });
    });

    describe('#getMetaTitle', () => {
        it('should return combined meta title when page title is set', () => {
            expect(getMetaTitle('Big Lottery Fund', 'Example')).to.equal('Example | Big Lottery Fund');
        });

        it('should return base title if no page title is set', () => {
            expect(getMetaTitle('Big Lottery Fund')).to.equal('Big Lottery Fund');
        });
    });

    describe('#getCurrentSection', () => {
        it('should return navigation section for a given page', () => {
            expect(getCurrentSection('toplevel', 'home')).to.equal('toplevel');
            expect(getCurrentSection('funding', 'root')).to.equal('funding');
            expect(getCurrentSection('funding', 'programmes')).to.equal('funding');
            expect(getCurrentSection('about', 'root')).to.equal('about');
            expect(getCurrentSection('toplevel', 'over10k')).to.be.undefined;
        });
    });
});
