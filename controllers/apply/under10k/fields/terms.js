'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions-next');
const { Field, CheckboxField } = require('../../lib/field-types');
const { FREE_TEXT_MAXLENGTH } = require('../constants');

module.exports = {
    fieldTermsAgreement1(locale) {
        const localise = get(locale);

        return new CheckboxField({
            locale: locale,
            name: 'termsAgreement1',
            type: 'checkbox',
            label: localise({
                en: oneLine`You have been authorised by the governing body of your
                    organisation (the board or committee that runs your organisation)
                    to submit this application and to accept the Terms and Conditions
                    set out above on their behalf.`,
                cy: oneLine`Rydych wedi cael eich awdurdodi gan gorff lywodraethol
                    eich sefydliad (y bwrdd neu bwyllgor sy’n rhedeg eich sefydliad)
                    i anfon y cais hwn ac i gytuno â’r Telerau ac Amodau wedi
                    ei osod uchod ar eu rhan.`,
            }),
            options: [
                {
                    value: 'yes',
                    label: localise({ en: 'I agree', cy: 'Rwy’n cytuno' }),
                },
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.string('yes').required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `You must confirm that you're authorised to submit this application`,
                        cy: `Rhaid ichi gadarnhau eich bod wedi cael eich awdurdodi i anfon y cais hwn`,
                    }),
                },
            ],
        });
    },
    fieldTermsAgreement2(locale) {
        const localise = get(locale);

        return new CheckboxField({
            locale: locale,
            name: 'termsAgreement2',
            type: 'checkbox',
            label: localise({
                en: oneLine`All the information you have provided in your
                    application is accurate and complete; and you will
                    notify us of any changes.`,
                cy: oneLine`Mae pob darn o wybodaeth rydych wedi ei ddarparu
                    yn eich cais yn gywir ac yn gyflawn; a byddwch yn ein
                    hysbysu am unrhyw newidiadau.`,
            }),
            options: [
                {
                    value: 'yes',
                    label: localise({ en: 'I agree', cy: 'Rwy’n cytuno' }),
                },
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: oneLine`You must confirm that the information you've
                            provided in this application is accurate`,
                        cy: oneLine`Rhaid ichi gadarnhau bod y wybodaeth rydych
                            wedi ei ddarparu yn y cais hwn yn gywir`,
                    }),
                },
            ],
        });
    },
    fieldTermsAgreement3(locale) {
        const localise = get(locale);

        return new CheckboxField({
            locale: locale,
            name: 'termsAgreement3',
            type: 'checkbox',
            label: localise({
                en: oneLine`You understand that we will use any personal information
                    you have provided for the purposes described under the
                    <a href="/about/customer-service/data-protection">
                        Data Protection Statement
                    </a>.`,
                cy: oneLine`Rydych yn deall y byddwn yn defnyddio unrhyw
                    wybodaeth bersonol rydych wedi ei ddarparu ar gyfer
                    dibenion wedi’i ddisgrifio dan y 
                    <a href="/welsh/about/customer-service/data-protection">
                        Datganiad Diogelu Data
                    </a>.`,
            }),
            options: [
                {
                    value: 'yes',
                    label: localise({ en: 'I agree', cy: 'Rwy’n cytuno' }),
                },
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: oneLine`You must confirm that you understand how
                            we'll use any personal information you've provided`,
                        cy: oneLine`Rhaid ichi gadarnhau eich bod yn deall sut y
                            byddwn yn defnyddio unrhyw wybodaeth bersonol
                            rydych wedi ei ddarparu`,
                    }),
                },
            ],
        });
    },
    fieldTermsAgreement4(locale) {
        const localise = get(locale);

        return new CheckboxField({
            locale: locale,
            name: 'termsAgreement4',
            type: 'checkbox',
            label: localise({
                en: oneLine`If information about this application is requested
                    under the Freedom of Information Act, we will release it
                    in line with our
                    <a href="/about/customer-service/freedom-of-information">
                        Freedom of Information policy.
                    </a>`,
                cy: oneLine`Os gofynnir am wybodaeth o’r cais hwn o dan y
                    Ddeddf Rhyddid Gwybodaeth, byddwn yn ei ryddhau yn unol â’n
                    <a href="/welsh/about/customer-service/freedom-of-information">
                        Polisi Rhyddid Gwybodaeth.
                    </a>`,
            }),
            options: [
                {
                    value: 'yes',
                    label: localise({ en: 'I agree', cy: 'Rwy’n cytuno' }),
                },
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: oneLine`You must confirm that you understand your
                            application is subject to our Freedom of Information policy`,
                        cy: oneLine`Rhaid ichi gadarnhau eich bod yn deall bod
                            eich cais yn ddarostyngedig i’n polisi Rhyddid Gwybodaeth`,
                    }),
                },
            ],
        });
    },
    fieldTermsPersonName(locale) {
        const localise = get(locale);

        return new Field({
            locale: locale,
            name: 'termsPersonName',
            label: localise({
                en: 'Full name of person completing this form',
                cy: 'Enw llawn y person sy’n cwblhau’r ffurflen',
            }),
            attributes: { autocomplete: 'name' },
            maxLength: FREE_TEXT_MAXLENGTH.large,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Enter the full name of the person completing this form`,
                        cy: `Rhowch enw llawn y person sy’n cwblhau’r ffurflen hwn`,
                    }),
                },
                {
                    type: 'string.max',
                    message: localise({
                        en: `Full name must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i’r enw llawn fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                    }),
                },
            ],
        });
    },
    fieldTermsPersonPosition(locale) {
        const localise = get(locale);

        return new Field({
            locale: locale,
            name: 'termsPersonPosition',
            label: localise({
                en: 'Position in organisation',
                cy: 'Safle o fewn y sefydliad',
            }),
            maxLength: FREE_TEXT_MAXLENGTH.large,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Enter the position of the person completing this form`,
                        cy: 'Rhowch safle y person sy’n cwblhau’r ffurlfen hwn',
                    }),
                },
                {
                    type: 'string.max',
                    message: localise({
                        en: `Position in organisation must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i’r safle o fewn y sefydliad fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                    }),
                },
            ],
        });
    },
    fieldTermsAgreementCovid2(locale) {
        const localise = get(locale);

        return new CheckboxField({
            locale: locale,
            name: 'termsAgreementCovid2',
            type: 'checkbox',
            label: oneLine`You confirm that you have considered the State Aid
                compliance requirements set out
                <a href="/funding/thinking-of-applying-for-funding/who-can-apply/covid-19-state-aid-compliance-guidance">
                    in this guidance
                </a>`,
            options: [
                {
                    value: 'yes',
                    label: localise({ en: 'I agree', cy: 'Rwy’n cytuno' }),
                },
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.when('projectCountry', {
                is: 'england',
                then: Joi.string().required(),
                otherwise: Joi.any().strip(),
            }),
            messages: [
                {
                    type: 'base',
                    message: `You must confirm that you have considered the State Aid compliance requirements`,
                },
            ],
        });
    },
    fieldTermsAgreementCovid3(locale) {
        const localise = get(locale);

        return new CheckboxField({
            locale: locale,
            name: 'termsAgreementCovid3',
            type: 'checkbox',
            label: oneLine`You confirm that your organisation satisfies the relevant
                requirements at 3.1 of the UK's Covid-19 Temporary Framework Scheme (SA. SA.56841)
                as explained in our
                <a href="/funding/thinking-of-applying-for-funding/who-can-apply/covid-19-state-aid-compliance-guidance">
                    in this guidance
                </a>`,
            options: [
                {
                    value: 'yes',
                    label: localise({ en: 'I agree', cy: 'Rwy’n cytuno' }),
                },
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.when('projectCountry', {
                is: 'england',
                then: Joi.string().required(),
                otherwise: Joi.any().strip(),
            }),
            messages: [
                {
                    type: 'base',
                    message: oneLine`You must confirm that your organisation satisfies
                        the relevant requirements at 3.1 of the UK's Covid-19
                        Temporary Framework Scheme`,
                },
            ],
        });
    },
};
