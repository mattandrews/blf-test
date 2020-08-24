'use strict';
const get = require('lodash/fp/get');
const compact = require('lodash/compact');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions-next');
const { RadioField } = require('../../lib/field-types');

const { ORGANISATION_TYPES, STATUTORY_BODY_TYPES } = require('../constants');

module.exports = {
    /*
     * Helper functions for other fields to toggle schemas
     * based on particular org types being present or not
     */
    stripIfExcludedOrgType(types, schema) {
        return Joi.when(Joi.ref('organisationType'), {
            is: Joi.exist().valid(...types),
            then: Joi.any().strip(),
            otherwise: schema,
        });
    },
    stripUnlessOrgTypes(types, schema) {
        return Joi.when(Joi.ref('organisationType'), {
            is: Joi.exist().valid(...types),
            then: schema,
            otherwise: Joi.any().strip(),
        });
    },
    /*
     * Fields for form usage
     * */
    fieldOrganisationType(locale, data = {}, flags = {}) {
        const localise = get(locale);

        function includeStatutoryGroups() {
            if (flags.enableGovCOVIDUpdates) {
                return get('projectCountry')(data) !== 'england';
            } else {
                return true;
            }
        }

        const options = compact([
            {
                value: ORGANISATION_TYPES.UNREGISTERED_VCO,
                label: localise({
                    en: `Unregistered voluntary or community organisation`,
                    cy: `Sefydliad gwirfoddol neu gymunedol anghofrestredig`,
                }),
                explanation: localise({
                    en: oneLine`An organisation set up with a governing document - like a constitution. 
                    But isn't a registered charity or company.`,
                    cy: oneLine`Sefydliad wedi’i sefydlu â dogfen lywodraethol – fel cyfansoddiad. 
                    Ond nid yw’n elusen na chwmni cofrestredig.`,
                }),
            },
            {
                value: ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY,
                label: localise({
                    en: 'Not-for-profit company',
                    cy: 'Cwmni di-elw',
                }),
                explanation: localise({
                    en: oneLine`A company limited by guarantee - registered with Companies House. 
                    And might also be registered as a charity.`,
                    cy: oneLine`Cwmni sy’n gyfyngedig drwy warant – yn gofrestredig â Thŷ’r Cwmnïau. 
                    A gall hefyd fod wedi’i gofrestru fel elusen.`,
                }),
            },
            {
                value: ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                label: localise({
                    en: `Registered charity (unincorporated)`,
                    cy: `Elusen gofrestredig (anghorfforedig)`,
                }),
                explanation: localise({
                    en: oneLine`A voluntary or community organisation that's a registered charity. 
                    But isn't a company registered with Companies House.`,
                    cy: oneLine`Sefydliad gwirfoddol neu gymunedol sydd yn elusen gofrestredig. 
                    Ond nid yw’n gwmni cofrestredig â Thŷ’r Cwmnïau.`,
                }),
            },
            {
                value: ORGANISATION_TYPES.CIO,
                label: localise({
                    en: `Charitable Incorporated Organisation (CIO or SCIO)`,
                    cy: `Sefydliad corfforedig elusennol (CIO / SCIO)`,
                }),
                explanation: localise({
                    en: oneLine`A registered charity with limited liability. 
                    But isn't a company registered with Companies House.`,
                    cy: oneLine`Elusen gofrestredig gydag atebolrwydd cyfyngedig. 
                    Ond nid yw’n gwmni cofrestredig â Thŷ’r Cwmnïau.`,
                }),
            },
            {
                value: ORGANISATION_TYPES.CIC,
                label: localise({
                    en: 'Community Interest Company (CIC)',
                    cy: 'Cwmni Budd Cymunedol',
                }),
                explanation: localise({
                    en: oneLine`A company registered with Companies House. 
                    And the Community Interest Company (CIC) Regulator.`,
                    cy: oneLine`Cwmni cofrestredig â Thŷ’r Cwmnïau. A’r Rheolydd Cwmni Budd Cymunedol.`,
                }),
            },
            includeStatutoryGroups() && {
                value: ORGANISATION_TYPES.SCHOOL,
                label: localise({
                    en: 'School',
                    cy: 'Ysgol',
                }),
            },
            includeStatutoryGroups() && {
                value: ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY,
                label: localise({
                    en: 'College or University',
                    cy: 'Coleg neu brifysgol',
                }),
            },
            includeStatutoryGroups() && {
                value: ORGANISATION_TYPES.STATUTORY_BODY,
                label: localise({
                    en: 'Statutory body',
                    cy: 'Corff statudol',
                }),
                explanation: localise({
                    en: oneLine`A public body - like a local authority or parish council. 
                    Or a police or health authority.`,
                    cy: oneLine`Corff cyhoeddus – fel awdurdod lleol neu gyngor plwyf. 
                    Neu awdurdod heddlu neu iechyd.`,
                }),
            },
            {
                value: ORGANISATION_TYPES.FAITH_GROUP,
                label: localise({
                    en: 'Faith-based group',
                    cy: 'Grŵp yn seiliedig ar ffydd',
                }),
                explanation: localise({
                    en: `Like a church, mosque, temple or synagogue.`,
                    cy: `Fel eglwys, mosg, teml neu synagog.`,
                }),
            },
        ]);

        return new RadioField({
            locale: locale,
            name: 'organisationType',
            label: localise({
                en: 'What type of organisation are you?',
                cy: 'Pa fath o sefydliad ydych chi?',
            }),
            explanation: localise({
                en: `If you're both a charity and a company—just pick ‘Not-for-profit company’ below.`,
                cy: `Os ydych yn elusen ac yn gwmni—dewiswch ‘Cwmni di-elw’ isod.`,
            }),
            options: options,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select a type of organisation',
                        cy: 'Dewiswch fath o sefydliad',
                    }),
                },
            ],
        });
    },
    fieldOrganisationSubTypeStatutoryBody(locale) {
        const localise = get(locale);

        return new RadioField({
            locale: locale,
            name: 'organisationSubType',
            label: localise({
                en: 'Tell us what type of statutory body you are',
                cy: 'Dywedwch wrthym pa fath o gorff statudol ydych',
            }),
            options: [
                {
                    value: STATUTORY_BODY_TYPES.PARISH_COUNCIL,
                    label: localise({
                        en: 'Parish Council',
                        cy: 'Cyngor plwyf',
                    }),
                },
                {
                    value: STATUTORY_BODY_TYPES.TOWN_COUNCIL,
                    label: localise({
                        en: 'Town Council',
                        cy: 'Cyngor tref',
                    }),
                },
                {
                    value: STATUTORY_BODY_TYPES.LOCAL_AUTHORITY,
                    label: localise({
                        en: 'Local Authority',
                        cy: 'Awdurdod lleol',
                    }),
                },
                {
                    value: STATUTORY_BODY_TYPES.NHS_TRUST,
                    label: localise({
                        en: 'NHS Trust/Health Authority',
                        cy: 'Ymddiriedaeth GIG/Awdurdod Iechyd',
                    }),
                },
                {
                    value: STATUTORY_BODY_TYPES.PRISON_SERVICE,
                    label: localise({
                        en: 'Prison Service',
                        cy: 'Gwasanaeth carchar',
                    }),
                },
                {
                    value: STATUTORY_BODY_TYPES.FIRE_SERVICE,
                    label: localise({
                        en: 'Fire Service',
                        cy: 'Gwasanaeth tân',
                    }),
                },
                {
                    value: STATUTORY_BODY_TYPES.POLICE_AUTHORITY,
                    label: localise({
                        en: 'Police Authority',
                        cy: 'Awdurdod heddlu',
                    }),
                },
            ],
            schema: Joi.when('organisationType', {
                is: ORGANISATION_TYPES.STATUTORY_BODY,
                then: Joi.string().required(),
                otherwise: Joi.any().strip(),
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Tell us what type of statutory body you are',
                        cy: 'Dywedwch wrthym pa fath o gorff statudol ydych',
                    }),
                },
            ],
        });
    },
};
