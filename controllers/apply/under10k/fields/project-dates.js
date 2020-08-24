'use strict';
const get = require('lodash/fp/get');
const has = require('lodash/fp/has');
const moment = require('moment');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions-next');
const { DateField, RadioField } = require('../../lib/field-types');

function getLeadTimeWeeks(country) {
    const countryLeadTimes = {
        'england': 18,
        'northern-ireland': 12,
        'scotland': 12,
        'wales': 12,
    };

    return countryLeadTimes[country] || 18;
}

module.exports = {
    _getLeadTimeWeeks: getLeadTimeWeeks, // Exported for tests

    fieldProjectStartDateCheck(locale, data = {}) {
        const localise = get(locale);

        const projectCountry = get('projectCountry')(data);
        const supportingCOVID19 = get('supportingCOVID19')(data);

        function options() {
            const optionAsap = {
                value: 'asap',
                label: localise({
                    en: `As soon as possible`,
                    cy: `Dyddiad cychwyn y prosiect`,
                }),
            };

            if (projectCountry !== 'england' && supportingCOVID19 === 'no') {
                optionAsap.attributes = { disabled: 'disabled' };
            } else if (projectCountry === 'england') {
                optionAsap.explanation = localise({
                    en:
                        'We expect you will start spending emergency funding straight away',
                    cy:
                        'Rydym yn disgwyl y byddwch yn dechrau gwario’r arian brys yn syth',
                });
            }

            const optionExactDate = {
                value: 'exact-date',
                label: localise({
                    en: `Enter an exact date`,
                    cy: `Rhowch union ddyddiad`,
                }),
            };

            if (projectCountry === 'england' || supportingCOVID19 === 'yes') {
                optionExactDate.attributes = { disabled: 'disabled' };
            }

            return [optionAsap, optionExactDate];
        }

        return new RadioField({
            locale: locale,
            name: 'projectStartDateCheck',
            label: localise({
                en: `When would you like to get the money if you are awarded?`,
                cy: `Pryd hoffech chi gael yr arian os ydych chi'n cael eich dyfarnu?`,
            }),
            explanation:
                get('projectCountry')(data) === 'england'
                    ? localise({
                          en: `You need to spend the money in six months or less, once we've awarded funding to you.`,
                          cy:
                              'Mae angen i chi wario’r arian mewn chwe mis neu lai, unwaith rydym wedi dyfarnu’r arian i chi.',
                      })
                    : null,
            options: options(),
            schema() {
                if (
                    get('projectCountry')(data) === 'england' ||
                    get('supportingCOVID19')(data) === 'yes'
                ) {
                    const excludeDisabled = (option) =>
                        !has('disabled')(option.attributes);

                    const mapValues = (option) => option.value;

                    return Joi.string()
                        .valid(
                            ...options().filter(excludeDisabled).map(mapValues)
                        )
                        .required();
                } else {
                    return Joi.any().strip();
                }
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
    fieldProjectStartDate(locale, data) {
        const localise = get(locale);

        const projectCountry = get('projectCountry')(data);

        const minDate = moment().add(getLeadTimeWeeks(projectCountry), 'weeks');

        const minDateExample = minDate
            .clone()
            .locale(locale)
            .format('DD MM YYYY');

        function schema() {
            /**
             * When projectStartDateCheck is asap
             * we don't show the project start date question
             * and instead pre-fill it with the current date
             * at the point of submission (see forSalesforce())
             */
            return Joi.when('projectStartDateCheck', {
                is: 'asap',
                then: Joi.any().strip(),
                otherwise: Joi.dateParts()
                    .minDate(minDate.format('YYYY-MM-DD'))
                    .required(),
            });
        }

        return new DateField({
            locale: locale,
            name: 'projectStartDate',
            label: localise({
                en: `Tell us when you'd like to get the money if you're awarded funding?`,
                cy: `Dywedwch wrthym pryd yr hoffech gael yr arian os dyfernir arian grant ichi?`,
            }),
            explanation: localise({
                en: oneLine`Don't worry, this can be an estimate. 
                But most projects must usually start on or after
                <strong>${minDateExample}</strong>.`,
                cy: oneLine`Peidiwch â phoeni, gall hwn fod yn amcangyfrif. 
                Ond fel rheol mae'n rhaid i'r mwyafrif o brosiectau ddechrau ar 
                neu ar ôl <strong>${minDateExample}</strong>.`,
            }),
            settings: {
                minYear: minDate.format('YYYY'),
            },
            schema: schema(),
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
                        en: oneLine`Date you start the project must be on
                            or after ${minDateExample}`,
                        cy: oneLine`Mae’n rhaid i ddyddiad dechrau eich
                            prosiect fod ar neu ar ôl ${minDateExample}`,
                    }),
                },
            ],
        });
    },
    fieldProjectEndDate(locale, data = {}, flags = {}) {
        const localise = get(locale);

        const projectCountry = get('projectCountry')(data);
        const projectStartDateCheck = get('projectStartDateCheck')(data);

        function getMaxDurationMonths() {
            if (projectCountry === 'england') {
                return 6;
            } else {
                return 12;
            }
        }

        function explanation() {
            if (projectCountry === 'england') {
                return localise({
                    en: oneLine`Given the COVID-19 emergency, you can have up to
                        ${getMaxDurationMonths()} months after award to spend the money.`,
                    cy: oneLine`O ystyried yr argyfwng COVID-19, gallwch gael 
                        hyd at 6 mis ar ôl dyfarnu i wario'r arian.`,
                });
            } else {
                return localise({
                    en: oneLine`You have up to ${getMaxDurationMonths()} months
                        after award to spend the money.`,
                    cy: oneLine`Mae gennych hyd at 12 mis ar 
                        ôl dyfarnu i wario'r arian.`,
                });
            }
        }

        function schema() {
            const maxDate = moment().add(getMaxDurationMonths(), 'months');

            /**
             * For projects in England when projectStartDateCheck is asap
             * we skip the project dates questions entirely and pre-fill
             * both the start and end date.
             *
             * In other countries when projectStartDateCheck is asap
             * we don't show the start date question but allow the end date
             * to be any future date within the max duration for the country.
             *
             * Otherwise we fallback to the default rules where
             * the end date must be within X months of the start date.
             */
            if (
                projectCountry === 'england' &&
                projectStartDateCheck === 'asap' &&
                flags.enableEnglandAutoEndDate === true
            ) {
                return Joi.any().strip();
            } else {
                return Joi.when('projectStartDateCheck', {
                    is: 'asap',
                    then: Joi.dateParts()
                        .minDate(moment().format('YYYY-MM-DD'))
                        .maxDate(maxDate.format('YYYY-MM-DD'))
                        .required(),
                    otherwise: Joi.dateParts()
                        .minDateRef(Joi.ref('projectStartDate'))
                        .rangeLimit(Joi.ref('projectStartDate'), {
                            amount: getMaxDurationMonths(),
                            unit: 'months',
                        })
                        .required(),
                });
            }
        }

        return new DateField({
            locale: locale,
            name: 'projectEndDate',
            label: localise({
                en: `When will you spend the money by?`,
                cy: `Erbyn pryd fyddwch chi'n gwario'r arian?`,
            }),
            explanation: explanation(),
            schema: schema(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Enter a project end date`,
                        cy: `Cofnodwch ddyddiad gorffen i’ch prosiect`,
                    }),
                },
                {
                    type: 'dateParts.minDate',
                    message: localise({
                        en: `Date must not be in the past`,
                        cy: `Rhaid i'r dyddiad beidio â bod yn y gorffennol`,
                    }),
                },
                {
                    type: 'dateParts.maxDate',
                    message: localise({
                        en: `Date must be no more than ${getMaxDurationMonths()} months away`,
                        cy: `Rhaid i'r dyddiad fod ddim mwy na 6 mis i ffwrdd`,
                    }),
                },
                {
                    type: 'dateParts.minDateRef',
                    message: localise({
                        en: `Date you end the project must be after the start date`,
                        cy: `Rhaid i ddyddiad gorffen y prosiect fod ar ôl y dyddiad dechrau`,
                    }),
                },
                {
                    type: 'dateParts.rangeLimit',
                    message: localise({
                        en: oneLine`Date must be within
                        ${getMaxDurationMonths()} months of the start date.`,
                        cy: oneLine`Rhaid i ddyddiad gorffen y prosiect fod o fewn
                        ${getMaxDurationMonths()} mis o ddyddiad dechrau’r prosiect.`,
                    }),
                },
            ],
        });
    },
};
