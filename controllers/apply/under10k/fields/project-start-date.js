'use strict';
const get = require('lodash/fp/get');
const moment = require('moment');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions');
const DateField = require('../../lib/field-types/date');

const getLeadTimeWeeks = require('../lib/lead-time');

module.exports = function (locale, data = {}) {
    const localise = get(locale);

    const projectCountry = get('projectCountry')(data);
    const minDate = moment().add(getLeadTimeWeeks(projectCountry), 'weeks');

    const minDateExample = minDate.clone().locale(locale).format('DD MM YYYY');

    return new DateField({
        locale: locale,
        name: 'projectStartDate',
        label: localise({
            en: `When would you like to start your project?`,
            cy: `Pryd hoffech ddechrau eich prosiect?`,
        }),
        explanation: localise({
            en: oneLine`Don't worry, this can be an estimate. 
                But most projects must usually start on or after
                <strong>${minDateExample}</strong>
                (projects about COVID-19 can start sooner than this,
                so just enter <strong>${minDateExample}</strong> for now).`,
            cy: oneLine`Peidiwch â phoeni, gall hwn fod yn amcangyfrif. 
                Ond fel rheol mae'n rhaid i'r mwyafrif o brosiectau ddechrau ar 
                neu ar ôl <strong>${minDateExample}</strong> 
                (gall prosiectau am COVID-19 gychwyn yn gynt na hyn, felly 
                nodwch <strong>${minDateExample}</strong> am nawr).`,
        }),
        settings: {
            minYear: minDate.format('YYYY'),
        },
        schema: Joi.dateParts()
            .minDate(minDate.format('YYYY-MM-DD'))
            .required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: `Enter a project start date`,
                    cy: `Cofnodwch ddyddiad dechrau i’ch prosiect`,
                }),
            },
            {
                type: 'dateParts.minDate',
                message: localise({
                    en: oneLine`Date you start the project must be on or after
                        ${minDateExample}`,
                    cy: oneLine`Mae’n rhaid i ddyddiad dechrau eich prosiect
                        fod ar neu ar ôl ${minDateExample}`,
                }),
            },
        ],
    });
};
