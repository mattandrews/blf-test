'use strict';
const getOr = require('lodash/fp/getOr');
const { stripIndents } = require('common-tags');

module.exports = function ({ data = {} }) {
    const projectCountries = getOr([], 'projectCountries')(data);

    function getNextSteps() {
        if (projectCountries.includes('england')) {
            return `<p>
                At the moment we're now focusing on funding projects and organisations
                supporting communities through the COVID-19 pandemic, so they can start sooner.
            </p>
            <p>
                We might get in touch to talk about your reserves and any other funding you might have.
                This is just so we can work out how best to support you financially.
                It would be great if you have these documents to hand, just in case we ask for them:
            </p>
            <ul>
                <li>your cashflow forecast for the next 12 months (or whatever you use to manage your budget)</li>
                <li>your most recent annual accounts</li>
                <li>your most recent bank statement.</li>
            </ul>
            <p>
                Once we’ve assessed your project we'll let you know
                if we're going to give you the funding. 
            </p>`;
        } else {
            return `<p>
                We’re now prioritising proposals for COVID-19 related projects,
                so they can start sooner. And it might take us longer to get
                back to you about proposals that aren’t COVID-19 related. 
            </p>
            <p>
                If it's something we can fund, you'll be asked if
                you want to make a full application.
            </p>`;
        }
    }

    return {
        title: `Thanks for telling us your proposal`,
        body: stripIndents`<p>
            We've emailed you a copy of what you wrote along
            with information about what happens next.
            Hold on to it in case you want to look at your answers again.
            It can be helpful to refer back to if we call.
        </p>
        <h2>What happens next?</h2>
        <p>Your proposal has been passed on to one of our funding officers.</p>
        ${getNextSteps()}
        <p>Any questions in the meantime? <a href="/contact">Contact us</a></p>`,
    };
};
