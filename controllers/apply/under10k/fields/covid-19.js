'use strict';
const get = require('lodash/fp/get');
const { oneLine, stripIndents } = require('common-tags');

const Joi = require('../../lib/joi-extensions-next');
const { RadioField } = require('../../lib/field-types');

module.exports = {
    fieldSupportingCOVID19(locale) {
        const localise = get(locale);

        return new RadioField({
            locale: locale,
            name: 'supportingCOVID19',
            label: localise({
                en: oneLine`Is your project supporting people
                    affected by the COVID-19 crisis?`,
                cy: oneLine`A yw'ch prosiect yn cefnogi pobl 
                    y mae argyfwng COVID-19 yn effeithio arnynt?`,
            }),
            explanation: localise({
                en: stripIndents`<p>
                    We will prioritise:
                </p>
                <ul>
                    <li>
                        organisations supporting people who are
                        at high risk from COVID-19
                    </li>
                    <li>
                        organisations supporting people most likely
                        to face increased demand and challenges as
                        a result of the COVID-19 crisis
                    </li>
                    <li>
                        organisations which connect communities
                        and support communities to work together
                        to respond to COVID-19.
                    </li>
                </ul>`,

                cy: stripIndents`<p>
                    Byddwn yn blaenoriaethu:
                </p>
                <ul>
                    <li>
                        sefydliadau sy'n cefnogi pobl sydd â risg uchel o COVID-19
                    </li>
                    <li>
                        sefydliadau sy'n cefnogi pobl sydd fwyaf tebygol o wynebu 
                        galw a heriau cynyddol o ganlyniad i argyfwng COVID-19
                    </li>
                    <li>
                        sefydliadau sy'n cysylltu cymunedau ac yn cefnogi cymunedau 
                        i weithio gyda'i gilydd i ymateb i COVID-19.
                    </li>
                </ul>`,
            }),
            options: [
                {
                    value: 'yes',
                    label: localise({ en: `Yes`, cy: `Ydi` }),
                },
                {
                    value: 'no',
                    label: localise({ en: `No`, cy: `Nac ydi` }),
                },
            ],
            schema(originalSchema) {
                return Joi.when('projectCountry', {
                    is: 'england',
                    then: Joi.any().strip(),
                    otherwise: originalSchema,
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select an option',
                        cy: 'Dewis opsiwn',
                    }),
                },
            ],
        });
    },
};
