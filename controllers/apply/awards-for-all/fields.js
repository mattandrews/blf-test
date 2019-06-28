'use strict';
const moment = require('moment/moment');
const { get } = require('lodash/fp');
const { flatMap, includes, values, concat, has } = require('lodash');

const Joi = require('../form-router-next/joi-extensions');
const locationsFor = require('./locations');
const {
    BENEFICIARY_GROUPS,
    MIN_BUDGET_TOTAL_GBP,
    MAX_BUDGET_TOTAL_GBP,
    MIN_AGE_MAIN_CONTACT,
    MIN_AGE_SENIOR_CONTACT,
    ORGANISATION_TYPES,
    STATUTORY_BODY_TYPES,
    ORG_MIN_AGE,
    FILE_LIMITS
} = require('./constants');

module.exports = function fieldsFor({ locale, data = {} }) {
    const localise = get(locale);

    const currentOrganisationType = get('organisationType')(data);
    const currentOrganisationSubType = get('organisationSubType')(data);

    function matchesOrganisationType(type) {
        return currentOrganisationType === type;
    }

    function multiChoice(options) {
        return Joi.array()
            .items(Joi.string().valid(options.map(option => option.value)))
            .single();
    }

    function emailField(props, additionalMessages = []) {
        const defaultProps = {
            label: localise({ en: 'Email', cy: '' }),
            type: 'email',
            attributes: { autocomplete: 'email' },
            isRequired: true,
            schema: Joi.string()
                .email()
                .required(),
            messages: concat(
                [
                    {
                        type: 'base',
                        message: localise({
                            en: 'Enter an email address',
                            cy: ''
                        })
                    },
                    {
                        type: 'string.email',
                        message: localise({
                            en: `Email address must be in the correct format, like name@example.com`,
                            cy: ``
                        })
                    }
                ],
                additionalMessages
            )
        };

        return { ...defaultProps, ...props };
    }

    function phoneField(props) {
        const defaultProps = {
            type: 'tel',
            attributes: { size: 30, autocomplete: 'tel' },
            isRequired: true,
            schema: Joi.string()
                .phoneNumber({ defaultCountry: 'GB', format: 'national' })
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a UK telephone number',
                        cy: ''
                    })
                },
                {
                    type: 'string.phonenumber',
                    message: localise({
                        en: 'Enter a real UK telephone number',
                        cy: ''
                    })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function addressField(props, additionalMessages = []) {
        const defaultProps = {
            type: 'address',
            isRequired: true,
            schema: Joi.ukAddress().required(),
            messages: concat(
                [
                    {
                        type: 'base',
                        message: localise({
                            en: 'Enter a full UK address',
                            cy: ''
                        })
                    },
                    {
                        type: 'any.empty',
                        key: 'line1',
                        message: localise({
                            en: 'Enter a building and street',
                            cy: ''
                        })
                    },
                    {
                        type: 'any.empty',
                        key: 'townCity',
                        message: localise({
                            en: 'Enter a town or city',
                            cy: ''
                        })
                    },
                    {
                        type: 'any.empty',
                        key: 'county',
                        message: localise({ en: 'Enter a county', cy: '' })
                    },
                    {
                        type: 'any.empty',
                        key: 'postcode',
                        message: localise({ en: 'Enter a postcode', cy: '' })
                    },
                    {
                        type: 'string.postcode',
                        key: 'postcode',
                        message: localise({
                            en: 'Enter a real postcode',
                            cy: ''
                        })
                    }
                ],
                additionalMessages
            )
        };

        return { ...defaultProps, ...props };
    }

    function addressHistoryField(props) {
        const defaultProps = {
            type: 'address-history',
            isRequired: true,
            get schema() {
                const addressHistorySchema = Joi.object({
                    currentAddressMeetsMinimum: Joi.string()
                        .valid(['yes', 'no'])
                        .required(),
                    previousAddress: Joi.when(
                        Joi.ref('currentAddressMeetsMinimum'),
                        {
                            is: 'no',
                            then: Joi.ukAddress().required(),
                            otherwise: Joi.any()
                        }
                    )
                });

                return Joi.when(Joi.ref('organisationType'), {
                    is: Joi.exist().valid(
                        ORGANISATION_TYPES.SCHOOL,
                        ORGANISATION_TYPES.STATUTORY_BODY
                    ),
                    then: Joi.any().strip(),
                    otherwise: addressHistorySchema.required()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a full UK address', cy: '' })
                },
                {
                    type: 'any.required',
                    key: 'currentAddressMeetsMinimum',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: ''
                    })
                },
                {
                    type: 'any.empty',
                    key: 'line1',
                    message: localise({
                        en: 'Enter a building and street',
                        cy: ''
                    })
                },
                {
                    type: 'any.empty',
                    key: 'townCity',
                    message: localise({ en: 'Enter a town or city', cy: '' })
                },
                {
                    type: 'any.empty',
                    key: 'county',
                    message: localise({ en: 'Enter a county', cy: '' })
                },
                {
                    type: 'any.empty',
                    key: 'postcode',
                    message: localise({ en: 'Enter a postcode', cy: '' })
                },
                {
                    type: 'string.postcode',
                    key: 'postcode',
                    message: localise({ en: 'Enter a real postcode', cy: '' })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function nameField(props, additionalMessages = []) {
        const defaultProps = {
            type: 'full-name',
            isRequired: true,
            schema: Joi.fullName().required(),
            messages: concat(
                [
                    {
                        type: 'base',
                        message: localise({
                            en: 'Enter a first and last name',
                            cy: ''
                        })
                    }
                ],
                additionalMessages
            )
        };

        return { ...defaultProps, ...props };
    }

    function dateOfBirthField(minAge, props) {
        const defaultProps = {
            explanation: localise({
                en: `We need your date of birth to help confirm who you are. And we do check your date of birth. So make sure you've entered it right. If you don't, it could delay your application.`,
                cy: ''
            }),
            type: 'date',
            attributes: {
                max: moment()
                    .subtract(minAge, 'years')
                    .format('YYYY-MM-DD')
            },
            isRequired: true,
            schema: Joi.dateParts()
                .dob(minAge)
                .when(Joi.ref('organisationType'), {
                    is: Joi.exist().valid(
                        ORGANISATION_TYPES.SCHOOL,
                        ORGANISATION_TYPES.STATUTORY_BODY
                    ),
                    then: Joi.any().strip(),
                    otherwise: Joi.required()
                }),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a date of birth', cy: '' })
                },
                {
                    type: 'any.invalid',
                    message: localise({ en: 'Enter a real date', cy: '' })
                },
                {
                    type: 'dateParts.dob',
                    message: localise({
                        en: `Must be at least ${minAge} years old`,
                        cy: ''
                    })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function organisationTypeField() {
        const options = [
            {
                value: ORGANISATION_TYPES.UNREGISTERED_VCO,
                label: localise({
                    en: 'Unregistered voluntary or community organisation',
                    cy: ''
                }),
                explanation: localise({
                    en: `<p>My organisation has been set up with a governing document, like a constitution, but it's not a charity or a company. Some examples of these sorts of groups would be a sports club, community club or residents association.</p>`,
                    cy: ``
                })
            },
            {
                value: ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                label: localise({
                    en: 'Registered charity (unincorporated)',
                    cy: ''
                }),
                explanation: localise({
                    en: `<p>My organisation is a voluntary or community organisation and is a registered charity, but <strong>is not</strong> a company registered with Companies House</p>`,
                    cy: ``
                })
            },
            {
                value: ORGANISATION_TYPES.CIO,
                label: localise({
                    en: 'Charitable incorporated organisation (CIO)',
                    cy: ''
                }),
                explanation: localise({
                    en: `<p>My organisation is a registered charity with limited liability, but <strong>is not</strong> a company registered with Companies House</p>`,
                    cy: ``
                })
            },
            {
                value: ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY,
                label: localise({ en: 'Not-for-profit company', cy: '' }),
                explanation: localise({
                    en: `<p>My organisation is a not-for-profit company registered with Companies House, and <strong>may also</strong> be registered as a charity</p>`,
                    cy: ``
                })
            },
            {
                value: ORGANISATION_TYPES.SCHOOL,
                label: localise({
                    en: 'School',
                    cy: ''
                }),
                explanation: localise({
                    en: `<p>My organisation is a school</p>`,
                    cy: ``
                })
            },
            {
                value: ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY,
                label: localise({
                    en: 'College or University',
                    cy: ''
                }),
                explanation: localise({
                    en: `<p>My organisation is a college, university, or other registered educational establishment</p>`,
                    cy: ``
                })
            },
            {
                value: ORGANISATION_TYPES.STATUTORY_BODY,
                label: localise({ en: 'Statutory body', cy: '' }),
                explanation: localise({
                    en: `<p>My organisation is a public body, such as a local authority, parish council, or police or health authority</p>`,
                    cy: ''
                })
            }
        ];

        return {
            name: 'organisationType',
            label: localise({
                en: 'What type of organisation are you?',
                cy: ''
            }),
            explanation: localise({
                en: `If you're both a charity and a company - just pick 'Registered charity' below.`,
                cy: ''
            }),
            type: 'radio',
            options: options,
            isRequired: true,
            schema: Joi.string()
                .valid(options.map(option => option.value))
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Choose a type of organisation',
                        cy: ''
                    })
                }
            ]
        };
    }

    function seniorContactRoleField() {
        function rolesFor(organisationType, organisationSubType) {
            const ROLES = {
                CHAIR: {
                    value: 'chair',
                    label: localise({ en: 'Chair', cy: '' })
                },
                CHANCELLOR: {
                    value: 'chancellor',
                    label: localise({ en: 'Chancellor', cy: '' })
                },
                CHIEF_EXECUTIVE: {
                    value: 'chief-executive',
                    label: localise({ en: 'Chief Executive', cy: '' })
                },
                CHIEF_EXECUTIVE_OFFICER: {
                    value: 'chief-executive-officer',
                    label: localise({ en: 'Chief Executive Officer', cy: '' })
                },
                COMPANY_DIRECTOR: {
                    value: 'company-director',
                    label: localise({ en: 'Company Director', cy: '' })
                },
                COMPANY_SECRETARY: {
                    value: 'company-secretary',
                    label: localise({ en: 'Company Secretary', cy: '' })
                },
                DEPUTY_PARISH_CLERK: {
                    value: 'deputy-parish-clerk',
                    label: localise({ en: 'Deputy Parish Clerk', cy: '' })
                },
                DIRECTOR: {
                    value: 'director',
                    label: localise({ en: 'Director', cy: '' })
                },
                ELECTED_MEMBER: {
                    value: 'elected-member',
                    label: localise({ en: 'Elected Member', cy: '' })
                },
                HEAD_TEACHER: {
                    value: 'head-teacher',
                    label: localise({ en: 'Head Teacher', cy: '' })
                },
                PARISH_CLERK: {
                    value: 'parish-clerk',
                    label: localise({ en: 'Parish Clerk', cy: '' })
                },
                SECRETARY: {
                    value: 'secretary',
                    label: localise({ en: 'Secretary', cy: '' })
                },
                TREASURER: {
                    value: 'treasurer',
                    label: localise({ en: 'Treasurer', cy: '' })
                },
                TRUSTEE: {
                    value: 'trustee',
                    label: localise({ en: 'Trustee', cy: '' })
                },
                VICE_CHAIR: {
                    value: 'vice-chair',
                    label: localise({ en: 'Vice-chair', cy: '' })
                },
                VICE_CHANCELLOR: {
                    value: 'vice-chancellor',
                    label: localise({ en: 'Vice-chancellor', cy: '' })
                }
            };

            let options = [];
            switch (organisationType) {
                case ORGANISATION_TYPES.UNREGISTERED_VCO:
                    options = [
                        ROLES.CHAIR,
                        ROLES.VICE_CHAIR,
                        ROLES.SECRETARY,
                        ROLES.TREASURER
                    ];
                    break;
                case ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY:
                    options = [ROLES.TRUSTEE];
                    break;
                case ORGANISATION_TYPES.CIO:
                    options = [ROLES.TRUSTEE, ROLES.CHIEF_EXECUTIVE_OFFICER];
                    break;
                case ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY:
                    options = [ROLES.COMPANY_DIRECTOR, ROLES.COMPANY_SECRETARY];
                    break;
                case ORGANISATION_TYPES.SCHOOL:
                    options = [ROLES.HEAD_TEACHER];
                    break;
                case ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY:
                    options = [ROLES.CHANCELLOR, ROLES.VICE_CHANCELLOR];
                    break;
                default:
                    options = values(ROLES);
                    break;
            }

            // Add custom options for statutory bodies
            if (
                organisationType === ORGANISATION_TYPES.STATUTORY_BODY &&
                organisationSubType
            ) {
                switch (organisationSubType) {
                    case STATUTORY_BODY_TYPES.PARISH_COUNCIL:
                        options = [
                            ROLES.PARISH_CLERK,
                            ROLES.DEPUTY_PARISH_CLERK
                        ];
                        break;
                    case STATUTORY_BODY_TYPES.TOWN_COUNCIL:
                        options = [ROLES.ELECTED_MEMBER, ROLES.CHAIR];
                        break;
                    case STATUTORY_BODY_TYPES.LOCAL_AUTHORITY:
                        options = [
                            ROLES.CHAIR,
                            ROLES.CHIEF_EXECUTIVE,
                            ROLES.DIRECTOR
                        ];
                        break;
                    case STATUTORY_BODY_TYPES.NHS_TRUST:
                        options = [ROLES.CHIEF_EXECUTIVE, ROLES.DIRECTOR];
                        break;
                    default:
                        options = values(ROLES);
                        break;
                }
            }

            return options;
        }

        return {
            name: 'seniorContactRole',
            label: localise({ en: 'Role', cy: '' }),
            get explanation() {
                const projectCountry = get('projectCountry')(data);
                const organisationType = get('organisationType')(data);

                let text = localise({
                    en: `<p>You told us what sort of organisation you are earlier. So the senior contact role options we're giving you now, are based on your organisation type. `,
                    cy: ''
                });

                if (this.type === 'radio') {
                    text += localise({
                        en:
                            'The options given to you for selection are based on this.',
                        cy: ''
                    });
                } else {
                    text += localise({
                        en:
                            'This should be someone in a position of authority in your organisation.',
                        cy: ''
                    });
                }

                text += localise({
                    en: '</p>',
                    cy: '</p>'
                });

                const isCharityOrCompany = includes(
                    [
                        ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                        ORGANISATION_TYPES.CIO,
                        ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY
                    ],
                    organisationType
                );

                if (isCharityOrCompany && projectCountry !== 'scotland') {
                    text += localise({
                        en: `<p><strong>Your senior contact must be listed as a member of your organisation's board or committee with the Charity Commission/Companies House.</strong></p>`
                    });
                } else if (
                    matchesOrganisationType(
                        ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY
                    )
                ) {
                    text += localise({
                        en: `<p><strong>
                            As a registered charity, your senior contact must be one of your organisation's trustees. This can include trustees taking on the role of Chair, Vice Chair or Treasurer.
                        </strong></p>`
                    });
                } else if (matchesOrganisationType(ORGANISATION_TYPES.CIO)) {
                    text += localise({
                        en: `<p><strong>
                            As a charity, your senior contact can be one of your organisation's trustees.
                            This can include trustees taking on the role of Chair, Vice Chair or Treasurer.
                        </strong></p>`
                    });
                }

                return text;
            },
            get type() {
                // Statutory bodies require a sub-type, some of which allow
                // free text input for roles.
                if (
                    currentOrganisationType ===
                        ORGANISATION_TYPES.STATUTORY_BODY &&
                    includes(
                        [
                            STATUTORY_BODY_TYPES.PRISON_SERVICE,
                            STATUTORY_BODY_TYPES.FIRE_SERVICE,
                            STATUTORY_BODY_TYPES.POLICE_AUTHORITY
                        ],
                        currentOrganisationSubType
                    )
                ) {
                    return 'text';
                }

                return 'radio';
            },
            options: rolesFor(
                currentOrganisationType,
                currentOrganisationSubType
            ),
            isRequired: true,
            get schema() {
                if (this.type === 'radio') {
                    return Joi.string()
                        .valid(this.options.map(option => option.value))
                        .required();
                } else {
                    return Joi.string().required();
                }
            },
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Choose a role', cy: '' })
                },
                {
                    type: 'any.allowOnly',
                    message: localise({
                        en: 'Senior contact role is not valid',
                        cy: ''
                    })
                }
            ]
        };
    }

    function conditionalBeneficiaryChoice({ match, schema }) {
        return Joi.when(Joi.ref('beneficiariesGroupsCheck'), {
            is: 'yes',
            // Conditional based on array
            // https://github.com/hapijs/joi/issues/622
            then: Joi.when(Joi.ref('beneficiariesGroups'), {
                is: Joi.array().items(
                    Joi.string()
                        .only(match)
                        .required(),
                    Joi.any()
                ),
                then: schema,
                otherwise: Joi.any().strip()
            }),
            otherwise: Joi.any().strip()
        });
    }

    const fields = {
        projectName: {
            name: 'projectName',
            label: localise({
                en: 'What is the name of your project?',
                cy: ''
            }),
            explanation: localise({
                en: 'The project name should be simple and to the point',
                cy: ''
            }),
            type: 'text',
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a project name', cy: '' })
                }
            ]
        },
        projectDateRange: {
            name: 'projectDateRange',
            label: localise({
                en: `When would you like to start and end your project?`,
                cy: ``
            }),
            get settings() {
                const minStart = {
                    amount: 12,
                    units: 'weeks'
                };
                const minStartDate = moment().add(
                    minStart.amount,
                    minStart.units
                );
                return {
                    minStart: minStart,
                    minDateExample: minStartDate.format('DD/MM/YYYY'),
                    fromDateExample: minStartDate
                        .subtract(1, 'days')
                        .format('D MMMM YYYY'),
                    minYear: minStartDate.format('YYYY'),
                    maxDurationFromStart: {
                        amount: 1,
                        units: 'years',
                        label: localise({
                            en: `twelve months`,
                            cy: ``
                        })
                    }
                };
            },
            get explanation() {
                return localise({
                    en: `<p>If you don't know exactly, your dates can be estimates. But you need to start your project after ${this.settings.minDateExample}.</p>
                      <p>We usually only fund projects that last ${this.settings.maxDurationFromStart.label} or less. So, the end date can't be more than ${this.settings.maxDurationFromStart.label} after the start date.</p>
                      <p><strong>If your project is a one-off event</strong></p>
                      <p>Just let us know the date you plan to hold the event in the start and end date boxes below.</p>`,
                    cy: ''
                });
            },
            type: 'date-range',
            isRequired: true,
            get schema() {
                const minDate = moment().add('12', 'weeks');
                return Joi.dateRange()
                    .minDate(minDate.format('YYYY-MM-DD'))
                    .futureEndDate()
                    .endDateLimit(
                        this.settings.maxDurationFromStart.amount,
                        this.settings.maxDurationFromStart.units
                    );
            },
            get messages() {
                return [
                    {
                        type: 'base',
                        message: localise({ en: 'Enter a date', cy: '' })
                    },
                    {
                        type: 'dateRange.both.invalid',
                        message: localise({
                            en: 'Enter a valid project start and end date',
                            cy: ''
                        })
                    },
                    {
                        type: 'datesRange.startDate.invalid',
                        message: localise({
                            en: 'Enter a valid project start date',
                            cy: ''
                        })
                    },
                    {
                        type: 'dateRange.endDate.invalid',
                        message: localise({
                            en: 'Enter a valid project end date',
                            cy: ''
                        })
                    },
                    {
                        type: 'dateRange.minDate.invalid',
                        message: localise({
                            en: `Date you start or end the project must be after ${this.settings.fromDateExample}`,
                            cy: ''
                        })
                    },
                    {
                        type: 'dateRange.endDate.beforeStartDate',
                        message: localise({
                            en: `Project end date must be after start date`,
                            cy: ''
                        })
                    },
                    {
                        type: 'dateRange.endDate.outsideLimit',
                        message: localise({
                            en: `Project end date must be within ${this.settings.maxDurationFromStart.label} of the start date.`,
                            cy: ''
                        })
                    }
                ];
            }
        },
        projectCountry: {
            name: 'projectCountry',
            label: localise({
                en: 'What country will your project be based in?',
                cy: ''
            }),
            explanation: localise({
                en: `We work slightly differently depending on which country your project is based in, to meet local needs and the regulations that apply there.`,
                cy: ''
            }),
            type: 'radio',
            options: [
                {
                    value: 'scotland',
                    label: localise({ en: 'Scotland', cy: '' })
                },
                {
                    value: 'england',
                    label: localise({ en: 'England (coming soon)', cy: '' }),
                    attributes: {
                        disabled: 'disabled'
                    }
                },
                {
                    value: 'northern-ireland',
                    label: localise({
                        en: 'Northern Ireland (coming soon)',
                        cy: ''
                    }),
                    attributes: {
                        disabled: 'disabled'
                    }
                },
                {
                    value: 'wales',
                    label: localise({ en: 'Wales (coming soon)', cy: '' }),
                    attributes: {
                        disabled: 'disabled'
                    }
                }
            ],
            isRequired: true,
            get schema() {
                return Joi.string()
                    .valid(
                        this.options
                            .filter(
                                option =>
                                    has(option, 'attributes.disabled') === false
                            )
                            .map(option => option.value)
                    )
                    .required();
            },
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Choose a valid country', cy: '' })
                }
            ]
        },
        projectLocation: {
            name: 'projectLocation',
            label: localise({
                en: 'Where will your project take place?',
                cy: ''
            }),
            explanation: localise({
                en: `If your project covers more than one area please choose the primary location`,
                cy: ''
            }),
            type: 'select',
            defaultOption: localise({ en: 'Select a location', cy: '' }),
            get optgroups() {
                const country = get('projectCountry')(data);
                return locationsFor(country);
            },
            isRequired: true,
            get schema() {
                const options = flatMap(this.optgroups, group => group.options);
                return Joi.string()
                    .valid(options.map(option => option.value))
                    .required();
            },
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Choose a location', cy: '' })
                }
            ]
        },
        projectLocationDescription: {
            name: 'projectLocationDescription',
            label: localise({
                en: `Tell us the towns, villages or wards where your beneficiaries live`,
                cy: ``
            }),
            type: 'text',
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a description', cy: '' })
                }
            ]
        },
        projectPostcode: {
            name: 'projectPostcode',
            label: localise({
                en: `What is the postcode of the location where your project will take place?`,
                cy: ``
            }),
            explanation: localise({
                en: `If your project will take place across different locations, please use the postcode where most of the project will take place.`,
                cy: ``
            }),
            type: 'text',
            attributes: {
                size: 10,
                autocomplete: 'postal-code'
            },
            isRequired: true,
            schema: Joi.string()
                .postcode()
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a real postcode', cy: '' })
                }
            ]
        },
        yourIdeaProject: {
            name: 'yourIdeaProject',
            label: localise({
                en: 'What would you like to do?',
                cy: ''
            }),
            explanation: localise({
                en: `<p><strong>Here are some ideas of what to tell us about your project:</strong></p>
                <ul>
                    <li>What you would like to do</li>
                    <li>What difference your project will make</li>
                    <li>Who will benefit from it</li>
                    <li>How long you expect to run it for. This can be an estimate</li>
                    <li>How you'll make sure people know about it</li>
                    <li>How you plan to learn from it and use this learning to shape future projects</li>
                    <li>Is it something new, or are you continuing something that has worked well previously? We want to fund both types of projects</li>
                </ul>`,
                cy: ''
            }),
            type: 'textarea',
            settings: {
                stackedSummary: true,
                showWordCount: true,
                minWords: 50,
                maxWords: 300,
                recommendedWords: 250
            },
            attributes: { rows: 20 },
            isRequired: true,
            get schema() {
                return Joi.string()
                    .minWords(this.settings.minWords)
                    .maxWords(this.settings.maxWords)
                    .required();
            },
            get messages() {
                return [
                    {
                        type: 'base',
                        message: localise({
                            en: 'Tell us about your project',
                            cy: ''
                        })
                    },
                    {
                        type: 'string.minWords',
                        message: localise({
                            en: `Answer must be at least ${this.settings.minWords} words`,
                            cy: ''
                        })
                    },
                    {
                        type: 'string.maxWords',
                        message: localise({
                            en: `Answer must be no more than ${this.settings.maxWords} words`,
                            cy: ''
                        })
                    }
                ];
            }
        },
        yourIdeaPriorities: {
            name: 'yourIdeaPriorities',
            label: localise({
                en: `How does your project meet at least one of our funding priorities?`,
                cy: ``
            }),
            explanation: localise({
                en: `<p>National Lottery Awards for All has three funding priorities, please tell us how your project will <strong>meet at least one of these:</strong></p>
                <ol>
                    <li>Bring people together and build strong relationships in and across communities</li>
                    <li>Improve the places and spaces that matter to communities</li>
                    <li>Help more people to reach their potential, by supporting them at the earliest possible stage</li>
                </ol>
                <p>You can tell us if your project meets more than one priority, but don't worry if it doesn't.</p>`,
                cy: ``
            }),
            type: 'textarea',
            settings: {
                stackedSummary: true,
                showWordCount: true,
                minWords: 50,
                maxWords: 150,
                recommendedWords: 100
            },
            attributes: {
                rows: 12
            },
            isRequired: true,
            get schema() {
                return Joi.string()
                    .minWords(this.settings.minWords)
                    .maxWords(this.settings.maxWords)
                    .required();
            },
            get messages() {
                return [
                    {
                        type: 'base',
                        message: localise({
                            en: `Tell us how your project meet at least one of our funding priorities`,
                            cy: ``
                        })
                    },
                    {
                        type: 'string.minWords',
                        message: localise({
                            en: `Answer must be at least ${this.settings.minWords} words`,
                            cy: ''
                        })
                    },
                    {
                        type: 'string.maxWords',
                        message: localise({
                            en: `Answer must be no more than ${this.settings.maxWords} words`,
                            cy: ''
                        })
                    }
                ];
            }
        },
        yourIdeaCommunity: {
            name: 'yourIdeaCommunity',
            label: localise({
                en: 'How does your project involve your community?',
                cy: ''
            }),
            explanation: localise({
                en: `
                <details class="o-details u-margin-bottom-s">
                    <summary class="o-details__summary">What do we mean by community?</summary>
                    <div class="o-details__content">
                        <ol>
                            <li>People living in the same area</li>
                            <li>People who have similar interests or life experiences, but might not live in the same area</li>
                            <li>Even though schools can be at the heart of a community - we'll only fund schools that also benefit the communities around them.</li>
                        </ol>
                    <div>
                </details>
                <p>We believe that people understand what's needed in their communities better than anyone. Tell us how your community came up with the idea for your project. We want to know how many people you've spoken to, and how they'll be involved in the development and delivery of the project.</p>`,
                cy: ''
            }),
            type: 'textarea',
            settings: {
                stackedSummary: true,
                showWordCount: true,
                minWords: 50,
                maxWords: 200,
                recommendedWords: 150
            },
            attributes: { rows: 15 },
            isRequired: true,
            get schema() {
                return Joi.string()
                    .minWords(this.settings.minWords)
                    .maxWords(this.settings.maxWords)
                    .required();
            },
            get messages() {
                return [
                    {
                        type: 'base',
                        message: localise({
                            en: `Tell us how your project involves your community`,
                            cy: ``
                        })
                    },
                    {
                        type: 'string.minWords',
                        message: localise({
                            en: `Answer must be at least ${this.settings.minWords} words`,
                            cy: ''
                        })
                    },
                    {
                        type: 'string.maxWords',
                        message: localise({
                            en: `Answer must be no more than ${this.settings.maxWords} words`,
                            cy: ''
                        })
                    }
                ];
            }
        },
        projectBudget: {
            name: 'projectBudget',
            label: localise({
                en: 'List the costs you would like us to fund',
                cy: ''
            }),
            explanation: localise({
                en: `<p>You should use budget headings, rather than a detailed list of items. For example, if you're applying for pens, pencils, paper and envelopes, using 'office supplies' is fine.</p>
                <p>Please note you can only have a maximum of 10 rows.</p>`,
                cy: ''
            }),
            type: 'budget',
            attributes: {
                min: MIN_BUDGET_TOTAL_GBP,
                max: MAX_BUDGET_TOTAL_GBP,
                rowLimit: 10
            },
            isRequired: true,
            schema: Joi.budgetItems()
                .validBudgetRange(MIN_BUDGET_TOTAL_GBP, MAX_BUDGET_TOTAL_GBP)
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a project budget', cy: '' })
                },
                {
                    type: 'any.empty',
                    key: 'item',
                    message: localise({
                        en: 'Enter an item or activity',
                        cy: ''
                    })
                },
                {
                    type: 'number.base',
                    key: 'cost',
                    message: localise({ en: 'Enter an amount', cy: '' })
                },
                {
                    type: 'budgetItems.overBudget',
                    message: localise({
                        en: `Total project costs must be less than £${MAX_BUDGET_TOTAL_GBP.toLocaleString()}`,
                        cy: ``
                    })
                },
                {
                    type: 'budgetItems.underBudget',
                    message: localise({
                        en: `Total project costs must be greater than £${MIN_BUDGET_TOTAL_GBP.toLocaleString()}`,
                        cy: ``
                    })
                }
            ]
        },
        projectTotalCosts: {
            name: 'projectTotalCosts',
            label: localise({
                en: 'Tell us the total cost of your project',
                cy: '(WELSH) Tell us the total cost of your project'
            }),
            explanation: localise({
                en: `<p>This is the cost of everything related to your project, even things you aren't asking us to fund.</p>

                <p>For example, if you are asking us for £8,000 and you are getting £10,000 from another funder to cover additional costs, then your total project cost is £18,000. If you are asking us for £8,000 and there are no other costs then your total project cost is £8,000.</p>`,
                cy: ``
            }),
            type: 'currency',
            isRequired: true,
            schema: Joi.budgetTotalCosts().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a total cost for your project',
                        cy: ''
                    })
                },
                {
                    type: 'number.base',
                    message: localise({
                        en: 'Total cost must be a real number',
                        cy: ''
                    })
                },
                {
                    type: 'budgetTotalCosts.underBudget',
                    message: localise({
                        en: `Total cost must be the same as or higher than the amount you’re asking us to fund`,
                        cy: ``
                    })
                }
            ]
        },
        beneficiariesGroupsCheck: {
            name: 'beneficiariesGroupsCheck',
            label: localise({
                en: `Is your project aimed at one of the following groups of people?`,
                cy: ``
            }),
            explanation: localise({
                en: `<ul>
                    <li>People of a particular ethnic background, gender, age or religious belief</li>
                    <li>Disabled people</li>
                    <li>Lesbian, gay or bisexual people</li>
                    <li>People with caring responsibilities</li>
                    <li>Any other specific group of people</li>
                </ul>`,
                cy: ``
            }),
            type: 'radio',
            options: [
                {
                    value: 'yes',
                    label: localise({ en: 'Yes', cy: '' })
                },
                {
                    value: 'no',
                    label: localise({ en: 'No', cy: '' })
                }
            ],
            isRequired: true,
            schema: Joi.string()
                .valid(['yes', 'no'])
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Answer yes or no', cy: '' })
                }
            ]
        },
        beneficiariesGroups: {
            name: 'beneficiariesGroups',
            label: localise({
                en: `What specific groups of people is your project aimed at?`,
                cy: ``
            }),
            type: 'checkbox',
            options: [
                {
                    value: BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                    label: localise({
                        en: 'People from a particular ethnic background',
                        cy: ''
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.GENDER,
                    label: localise({
                        en: 'People of a particular gender',
                        cy: ''
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.AGE,
                    label: localise({
                        en: 'People of a particular age',
                        cy: ''
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                    label: localise({ en: 'Disabled people', cy: '' })
                },
                {
                    value: BENEFICIARY_GROUPS.RELIGION,
                    label: localise({
                        en: 'People with a particular religious belief',
                        cy: ''
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.LGBT,
                    label: localise({
                        en: 'Lesbian, gay, or bisexual people',
                        cy: ''
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.CARING,
                    label: localise({
                        en: `People with caring responsibilities`,
                        cy: ``
                    })
                }
            ],
            get schema() {
                return Joi.when('beneficiariesGroupsCheck', {
                    is: 'yes',
                    then: Joi.when('beneficiariesGroupsOther', {
                        is: Joi.string(),
                        then: Joi.any().strip(),
                        otherwise: multiChoice(this.options).required()
                    }),
                    otherwise: Joi.any().strip()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesGroupsOther: {
            name: 'beneficiariesGroupsOther',
            label: localise({ en: 'Other', cy: '' }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .optional(),
            messages: []
        },
        beneficiariesEthnicBackground: {
            name: 'beneficiariesGroupsEthnicBackground',
            label: localise({ en: `Ethnic background`, cy: '' }),
            explanation: localise({
                en: `You told us that your project mostly benefits people from a particular ethnic background. Please tell us which one(s).`,
                cy: ``
            }),
            type: 'checkbox',
            optgroups: [
                {
                    label: localise({
                        en: 'White',
                        cy: ''
                    }),
                    options: [
                        {
                            value: 'white-british',
                            label: localise({
                                en: `English / Welsh / Scottish / Northern Irish / British`,
                                cy: ''
                            })
                        },
                        {
                            value: 'irish',
                            label: localise({ en: 'Irish', cy: '' })
                        },
                        {
                            value: 'gypsy-or-irish-traveller',
                            label: localise({
                                en: 'Gypsy or Irish Traveller',
                                cy: ''
                            })
                        },
                        {
                            value: 'white-other',
                            label: localise({
                                en: 'Any other White background',
                                cy: ''
                            })
                        }
                    ]
                },
                {
                    label: localise({
                        en: 'Mixed / Multiple ethnic groups',
                        cy: ''
                    }),
                    options: [
                        {
                            value: 'mixed-background',
                            label: localise({
                                en: 'Mixed ethnic background',
                                cy: ''
                            }),
                            explanation: localise({
                                en: `this refers to people whose parents are of a different ethnic background to each other`,
                                cy: ``
                            })
                        }
                    ]
                },
                {
                    label: localise({
                        en: 'Asian / Asian British',
                        cy: ''
                    }),
                    options: [
                        {
                            value: 'indian',
                            label: localise({ en: 'Indian', cy: '' })
                        },
                        {
                            value: 'pakistani',
                            label: localise({ en: 'Pakistani', cy: '' })
                        },
                        {
                            value: 'bangladeshi',
                            label: localise({ en: 'Bangladeshi', cy: '' })
                        },
                        {
                            value: 'chinese',
                            label: localise({ en: 'Chinese', cy: '' })
                        },
                        {
                            value: 'asian-other',
                            label: localise({
                                en: 'Any other Asian background',
                                cy: ''
                            })
                        }
                    ]
                },
                {
                    label: localise({
                        en: 'Black / African / Caribbean / Black British',
                        cy: ''
                    }),
                    options: [
                        {
                            value: 'caribbean',
                            label: localise({ en: 'Caribbean', cy: '' })
                        },
                        {
                            value: 'african',
                            label: localise({ en: 'African', cy: '' })
                        },
                        {
                            value: 'black-other',
                            label: localise({
                                en: `Any other Black / African / Caribbean background`,
                                cy: ''
                            })
                        }
                    ]
                },
                {
                    label: localise({
                        en: 'Other ethnic group',
                        cy: ''
                    }),
                    options: [
                        {
                            value: 'arab',
                            label: localise({ en: 'Arab', cy: '' })
                        },

                        {
                            value: 'other',
                            label: localise({ en: 'Any other', cy: '' })
                        }
                    ]
                }
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                    schema: multiChoice(
                        flatMap(this.optgroups, o => o.options)
                    ).required()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesGroupsGender: {
            name: 'beneficiariesGroupsGender',
            label: localise({
                en: `Gender`,
                cy: ''
            }),
            explanation: localise({
                en: `You told us that your project mostly benefits people of a particular gender. Please tell us which one(s).`,
                cy: ``
            }),
            type: 'checkbox',
            options: [
                { value: 'male', label: localise({ en: 'Male', cy: '' }) },
                { value: 'female', label: localise({ en: 'Female', cy: '' }) },
                { value: 'trans', label: localise({ en: 'Trans', cy: '' }) },
                {
                    value: 'non-binary',
                    label: localise({ en: 'Non-binary', cy: '' })
                },
                {
                    value: 'intersex',
                    label: localise({ en: 'Intersex', cy: '' })
                }
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.GENDER,
                    schema: multiChoice(this.options).required()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesGroupsAge: {
            name: 'beneficiariesGroupsAge',
            label: localise({
                en: `Age`,
                cy: ''
            }),
            explanation: localise({
                en: `You told us that your project mostly benefits people from particular age groups. Please tell us which one(s).`,
                cy: ''
            }),
            type: 'checkbox',
            options: [
                { value: '0-12', label: localise({ en: '0–12', cy: '' }) },
                { value: '13-24', label: localise({ en: '13-24', cy: '' }) },
                { value: '25-64', label: localise({ en: '25-64', cy: '' }) },
                { value: '65+', label: localise({ en: '65+', cy: '' }) }
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.AGE,
                    schema: multiChoice(this.options).required()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesGroupsDisabledPeople: {
            name: 'beneficiariesGroupsDisabledPeople',
            label: localise({ en: `Disabled people`, cy: '' }),
            explanation: localise({
                en: `<p>You told us that your project mostly benefits disabled people. Please tell us which one(s).</p>
                <p>We use the definition from the Equality Act 2010, which defines a disabled person as someone who has a mental or physical impairment that has a substantial and long-term adverse effect on their ability to carry out normal day to day activity.</p>`,
                cy: ``
            }),

            type: 'checkbox',
            options: [
                {
                    value: 'sensory',
                    label: localise({
                        en: 'Disabled people with sensory impairments',
                        cy: ''
                    }),
                    explanation: localise({
                        en: 'e.g. visual and hearing impairments',
                        cy: ''
                    })
                },
                {
                    value: 'physical',
                    label: localise({
                        en: `Disabled people with physical impairments`,
                        cy: ``
                    }),
                    explanation: localise({
                        en: `e.g. neuromotor impairments, such as epilepsy and cerebral palsy, or muscular/skeletal conditions, such as missing limbs and arthritis`,
                        cy: ''
                    })
                },
                {
                    value: 'learning',
                    label: localise({
                        en: `Disabled people with learning or mental difficulties`,
                        cy: ''
                    }),
                    explanation: localise({
                        en: `e.g. reduced intellectual ability and difficulty with everyday activities or conditions such as autism`,
                        cy: ''
                    })
                }
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                    schema: multiChoice(this.options).required()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesGroupsReligion: {
            name: 'beneficiariesGroupsReligion',
            label: localise({
                en: `Religion or belief`,
                cy: ``
            }),
            explanation: localise({
                en: `You have indicated that your project mostly benefits people of a particular religion or belief, please select from the following`,
                cy: ''
            }),
            type: 'checkbox',
            options: [
                {
                    value: 'buddhist',
                    label: localise({ en: 'Buddhist', cy: '' })
                },
                {
                    value: 'christian',
                    label: localise({ en: 'Christian', cy: '' })
                },
                { value: 'jewish', label: localise({ en: 'Jewish', cy: '' }) },
                { value: 'muslim', label: localise({ en: 'Muslim', cy: '' }) },
                { value: 'sikh', label: localise({ en: 'Sikh', cy: '' }) },
                {
                    value: 'no-religion',
                    label: localise({ en: 'No religion', cy: '' })
                }
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.RELIGION,
                    schema: multiChoice(this.options).required()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesGroupsReligionOther: {
            name: 'beneficiariesGroupsReligionOther',
            label: localise({ en: 'Other', cy: '' }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .optional(),
            messages: []
        },
        beneficiariesWelshLanguage: {
            name: 'beneficiariesWelshLanguage',
            label: localise({
                en: `How many of the people who will benefit from your project speak Welsh?`,
                cy: ``
            }),
            type: 'radio',
            options: [
                {
                    value: 'all',
                    label: localise({ en: 'All', cy: '' })
                },
                {
                    value: 'more-than-half',
                    label: localise({ en: 'More than half', cy: '' })
                },
                {
                    value: 'less-than-half',
                    label: localise({ en: 'Less than half', cy: '' })
                },
                {
                    value: 'none',
                    label: localise({ en: 'None', cy: '' })
                }
            ],
            isRequired: true,
            get schema() {
                return Joi.when('projectCountry', {
                    is: 'wales',
                    then: Joi.string()
                        .valid(this.options.map(option => option.value))
                        .required(),
                    otherwise: Joi.any().strip()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Choose an option', cy: '' })
                }
            ]
        },
        beneficiariesNorthernIrelandCommunity: {
            name: 'beneficiariesNorthernIrelandCommunity',
            label: localise({
                en: `Which community do the people who will benefit from your project belong to?`,
                cy: ``
            }),
            type: 'radio',
            options: [
                {
                    value: 'both-catholic-and-protestant',
                    label: localise({
                        en: 'Both Catholic and Protestant',
                        cy: ''
                    })
                },
                {
                    value: 'mainly-protestant',
                    label: localise({
                        en: `Mainly Protestant (more than 60 per cent)`,
                        cy: ''
                    })
                },
                {
                    value: 'mainly-catholic',
                    label: localise({
                        en: 'Mainly Catholic (more than 60 per cent)',
                        cy: ''
                    })
                },
                {
                    value: 'neither-catholic-or-protestant',
                    label: localise({
                        en: 'Neither Catholic or Protestant',
                        cy: ''
                    })
                }
            ],
            isRequired: true,
            get schema() {
                return Joi.when('projectCountry', {
                    is: 'northern-ireland',
                    then: Joi.string()
                        .valid(this.options.map(option => option.value))
                        .required(),
                    otherwise: Joi.any().strip()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Choose an option', cy: '' })
                }
            ]
        },
        organisationLegalName: {
            name: 'organisationLegalName',
            label: localise({
                en: `What is the full legal name of your organisation?`,
                cy: ``
            }),
            explanation: localise({
                en: `<p>This must be as shown on your <strong>governing document</strong>. Your governing document could be called one of several things, depending on the type of organisation you're applying on behalf of. It may be called a constitution, trust deed, memorandum and articles of association, or something else entirely.</p>`,
                cy: ``
            }),
            type: 'text',
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter the full legal name of the organisation',
                        cy: ''
                    })
                }
            ]
        },
        organisationTradingName: {
            name: 'organisationTradingName',
            label: localise({
                en: `Does your organisation use a different name in your day-to-day work?`,
                cy: ``
            }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .optional(),
            messages: []
        },
        organisationStartDate: {
            name: 'organisationStartDate',
            type: 'month-year',
            label: localise({
                en: `When was your organisation set up?`,
                cy: ''
            }),
            explanation: localise({
                en: `<p>Please tell us the month and year.</p>
                     <p><strong>For example: 11 2017</strong></p>`,
                cy: ''
            }),
            isRequired: true,
            schema: Joi.monthYear()
                .pastDate()
                .minTimeAgo(ORG_MIN_AGE.amount, ORG_MIN_AGE.unit)
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a day and month', cy: '' })
                },
                {
                    type: 'any.invalid',
                    message: localise({
                        en: 'Enter a real day and month',
                        cy: ''
                    })
                },
                {
                    type: 'monthYear.pastDate',
                    message: localise({
                        en: 'Enter a past date',
                        cy: ''
                    })
                }
            ]
        },
        organisationAddress: addressField({
            name: 'organisationAddress',
            label: localise({
                en: `What is the main or registered address of your organisation?`,
                cy: ``
            }),
            explanation: localise({
                en: `<p>For example: EC4A 1DE</p>`,
                cy: ``
            })
        }),
        organisationType: organisationTypeField(),
        organisationSubTypeStatutoryBody: {
            name: 'organisationSubType',
            label: localise({
                en: 'Tell us what type of statutory body you are',
                cy: ''
            }),
            type: 'radio',
            options: [
                {
                    value: STATUTORY_BODY_TYPES.PARISH_COUNCIL,
                    label: localise({ en: 'Parish Council', cy: '' })
                },
                {
                    value: STATUTORY_BODY_TYPES.TOWN_COUNCIL,
                    label: localise({ en: 'Town Council', cy: '' })
                },
                {
                    value: STATUTORY_BODY_TYPES.LOCAL_AUTHORITY,
                    label: localise({ en: 'Local Authority', cy: '' })
                },
                {
                    value: STATUTORY_BODY_TYPES.NHS_TRUST,
                    label: localise({
                        en: 'NHS Trust/Health Authority',
                        cy: ''
                    })
                },
                {
                    value: STATUTORY_BODY_TYPES.PRISON_SERVICE,
                    label: localise({ en: 'Prison Service', cy: '' })
                },
                {
                    value: STATUTORY_BODY_TYPES.FIRE_SERVICE,
                    label: localise({ en: 'Fire Service', cy: '' })
                },
                {
                    value: STATUTORY_BODY_TYPES.POLICE_AUTHORITY,
                    label: localise({ en: 'Police Authority', cy: '' })
                }
            ],
            isRequired: true,
            schema: Joi.when('organisationType', {
                is: ORGANISATION_TYPES.STATUTORY_BODY,
                then: Joi.string().required(),
                otherwise: Joi.any().strip()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Tell us what type of statutory body you are',
                        cy: ''
                    })
                }
            ]
        },
        companyNumber: {
            name: 'companyNumber',
            label: localise({ en: 'Companies House number', cy: '' }),
            type: 'text',
            isRequired: true,
            schema: Joi.when('organisationType', {
                is: ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY,
                then: Joi.string().required(),
                otherwise: Joi.any().strip()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter your organisation’s Companies House number',
                        cy: ''
                    })
                }
            ]
        },
        charityNumber: {
            name: 'charityNumber',
            label: localise({ en: 'Charity registration number', cy: '' }),
            explanation: localise({
                en: `If you're a Scottish charity registered with OSCR, we only need the last 5 numbers.`,
                cy: ''
            }),
            type: 'text',
            attributes: { size: 20 },
            isRequired: includes(
                [
                    ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                    ORGANISATION_TYPES.CIO
                ],
                currentOrganisationType
            ),
            schema: Joi.when('organisationType', {
                is: ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                then: Joi.number().required()
            }).when('organisationType', {
                is: ORGANISATION_TYPES.CIO,
                then: Joi.number().required()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter your organisation’s charity number',
                        cy: ''
                    })
                }
            ]
        },
        educationNumber: {
            name: 'educationNumber',
            label: localise({ en: 'Department for Education number', cy: '' }),
            type: 'text',
            attributes: { size: 20 },
            isRequired: true,
            schema: Joi.when('organisationType', {
                is: Joi.exist().valid(
                    ORGANISATION_TYPES.SCHOOL,
                    ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY
                ),
                then: Joi.string().required()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Enter your organisation’s Department for Education number`,
                        cy: ''
                    })
                }
            ]
        },
        accountingYearDate: {
            name: 'accountingYearDate',
            label: localise({
                en: 'What is your accounting year end date?',
                cy: ''
            }),
            explanation: localise({
                en: `<p><strong>For example: 31 03</strong></p>`,
                cy: ''
            }),
            type: 'day-month',
            isRequired: true,
            schema: Joi.when(Joi.ref('organisationStartDate.isBeforeMin'), {
                is: true,
                then: Joi.dayMonth().required(),
                otherwise: Joi.any().strip()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a day and month', cy: '' })
                },
                {
                    type: 'any.invalid',
                    message: localise({
                        en: 'Enter a real day and month',
                        cy: ''
                    })
                }
            ]
        },
        totalIncomeYear: {
            name: 'totalIncomeYear',
            label: localise({
                en: 'What is your total income for the year?',
                cy: ''
            }),
            type: 'currency',
            isRequired: true,
            schema: Joi.when(Joi.ref('organisationStartDate.isBeforeMin'), {
                is: true,
                then: Joi.number().required(),
                otherwise: Joi.any().strip()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a total income for the year',
                        cy: ''
                    })
                },
                {
                    type: 'any.invalid',
                    message: localise({
                        en: 'Total income must be a real number',
                        cy: ''
                    })
                }
            ]
        },
        mainContactName: nameField(
            {
                name: 'mainContactName',
                label: localise({ en: 'Full name of main contact', cy: '' }),
                schema: Joi.fullName()
                    .mainContact()
                    .required()
            },
            [
                {
                    type: 'name.matchesOther',
                    message: localise({
                        en: `Main contact name must be different from the senior contact's name`,
                        cy: ``
                    })
                }
            ]
        ),
        mainContactDateOfBirth: dateOfBirthField(MIN_AGE_MAIN_CONTACT, {
            name: 'mainContactDateOfBirth',
            label: localise({ en: 'Date of birth', cy: '' })
        }),
        mainContactAddress: addressField(
            {
                name: 'mainContactAddress',
                label: localise({ en: 'Home address', cy: '' }),
                explanation: localise({
                    en: `We need your home address to help confirm who you are. And we do check your address. So make sure you've entered it right. If you don't, it could delay your application.`,
                    cy: ''
                }),
                schema: Joi.ukAddress()
                    .mainContact()
                    .when(Joi.ref('organisationType'), {
                        is: Joi.exist().valid(
                            ORGANISATION_TYPES.SCHOOL,
                            ORGANISATION_TYPES.STATUTORY_BODY
                        ),
                        then: Joi.any().strip()
                    })
            },
            [
                {
                    type: 'address.matchesOther',
                    message: localise({
                        en: `Main contact address must be different from the senior contact's address`,
                        cy: ``
                    })
                }
            ]
        ),
        mainContactAddressHistory: addressHistoryField({
            name: 'mainContactAddressHistory',
            label: localise({
                en: 'Have they lived at this address for the last three years?',
                cy: ''
            })
        }),
        mainContactEmail: emailField(
            {
                name: 'mainContactEmail',
                label: localise({ en: 'Email', cy: '' }),
                explanation: localise({
                    en:
                        'We’ll use this whenever we get in touch about the project',
                    cy: ''
                }),
                schema: Joi.string()
                    .email()
                    .invalid(Joi.ref('seniorContactEmail'))
            },
            [
                {
                    type: 'any.invalid',
                    message: localise({
                        en: `Main contact email address must be different from the senior contact's email address`,
                        cy: ``
                    })
                }
            ]
        ),
        mainContactPhone: phoneField({
            name: 'mainContactPhone',
            label: localise({ en: 'Telephone number', cy: '' })
        }),
        mainContactCommunicationNeeds: {
            name: 'mainContactCommunicationNeeds',
            label: localise({
                en: `Please tell us about any particular communication needs this contact has.`,
                cy: ``
            }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .optional(),
            messages: []
        },
        seniorContactRole: seniorContactRoleField(),
        seniorContactName: nameField(
            {
                name: 'seniorContactName',
                label: localise({ en: 'Full name of senior contact', cy: '' }),
                schema: Joi.fullName()
                    .seniorContact()
                    .required()
            },
            [
                {
                    type: 'name.matchesOther',
                    message: localise({
                        en: `Senior contact name must be different from the main contact's name`,
                        cy: ``
                    })
                }
            ]
        ),
        seniorContactDateOfBirth: dateOfBirthField(MIN_AGE_SENIOR_CONTACT, {
            name: 'seniorContactDateOfBirth',
            label: localise({ en: 'Date of birth', cy: '' })
        }),
        seniorContactAddress: addressField(
            {
                name: 'seniorContactAddress',
                label: localise({ en: 'Home address', cy: '' }),
                explanation: localise({
                    en: `We need your home address to help confirm who you are. And we do check your address. So make sure you've entered it right. If you don't, it could delay your application.`,
                    cy: ''
                }),
                schema: Joi.ukAddress()
                    .seniorContact()
                    .when(Joi.ref('organisationType'), {
                        is: Joi.exist().valid(
                            ORGANISATION_TYPES.SCHOOL,
                            ORGANISATION_TYPES.STATUTORY_BODY
                        ),
                        then: Joi.any().strip()
                    })
            },
            [
                {
                    type: 'address.matchesOther',
                    message: localise({
                        en: `Senior contact address must be different from the main contact's address`,
                        cy: ``
                    })
                }
            ]
        ),
        seniorContactAddressHistory: addressHistoryField({
            name: 'seniorContactAddressHistory',
            label: localise({
                en: `Have you lived at your last address for at least three years?`,
                cy: ``
            })
        }),
        seniorContactEmail: emailField({
            name: 'seniorContactEmail',
            label: localise({ en: 'Email', cy: '' }),
            explanation: localise({
                en: 'We’ll use this whenever we get in touch about the project',
                cy: ''
            })
        }),
        seniorContactPhone: phoneField({
            name: 'seniorContactPhone',
            label: localise({ en: 'Telephone number', cy: '' })
        }),
        seniorContactCommunicationNeeds: {
            name: 'seniorContactCommunicationNeeds',
            label: localise({
                en: `Please tell us about any particular communication needs this contact has.`,
                cy: ``
            }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .optional(),
            messages: []
        },
        bankAccountName: {
            name: 'bankAccountName',
            label: localise({
                en:
                    'Tell us the name of your organisation - as it appears on the bank statement',
                cy: ''
            }),
            explanation: localise({
                en: `Not the name of your bank`,
                cy: ``
            }),
            type: 'text',
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en:
                            'Enter the name of your organisation as it appears on your bank statement',
                        cy: ''
                    })
                }
            ]
        },
        bankSortCode: {
            name: 'bankSortCode',
            label: localise({ en: 'Sort code', cy: '' }),
            explanation: localise({ en: 'eg. 123456', cy: '' }),
            type: 'text',
            attributes: { size: 20 },
            isRequired: true,
            schema: Joi.string()
                .replace(/\D/g, '')
                .length(6)
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a sort code', cy: '' })
                },
                {
                    type: 'string.length',
                    message: localise({
                        en: 'Enter a six digit sort code',
                        cy: ''
                    })
                }
            ]
        },
        bankAccountNumber: {
            name: 'bankAccountNumber',
            label: localise({ en: 'Account number', cy: '' }),
            explanation: localise({ en: 'eg. 12345678', cy: '' }),
            type: 'text',
            isRequired: true,
            schema: Joi.string()
                .replace(/\D/g, '')
                .min(6)
                .max(11)
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter an account number', cy: '' })
                },
                {
                    type: 'string.min',
                    message: localise({
                        en: 'Enter a valid length account number',
                        cy: ''
                    })
                },
                {
                    type: 'string.max',
                    message: localise({
                        en: 'Enter a valid length account number',
                        cy: ''
                    })
                }
            ]
        },
        buildingSocietyNumber: {
            name: 'buildingSocietyNumber',
            label: localise({
                en: 'Building society number',
                cy: ''
            }),
            type: 'text',
            explanation: localise({
                en: `You only need to fill this in if your organisation's account is with a building society.`,
                cy: ``
            }),
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .empty(),
            messages: []
        },
        bankStatement: {
            name: 'bankStatement',
            label: localise({ en: 'Upload a bank statement', cy: '' }),
            type: 'file',
            attributes: {
                accept: FILE_LIMITS.TYPES.map(type => type.mime).join(',')
            },
            isRequired: true,
            schema: Joi.object({
                filename: Joi.string().required(),
                size: Joi.number()
                    .max(FILE_LIMITS.SIZE.value)
                    .required(),
                type: Joi.string()
                    .valid(FILE_LIMITS.TYPES.map(type => type.mime))
                    .required()
            }).required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Provide a bank statement',
                        cy: ''
                    })
                },
                {
                    type: 'any.allowOnly',
                    message: localise({
                        en: `Please upload a file in one of these formats: ${FILE_LIMITS.TYPES.map(
                            type => type.label
                        ).join(', ')}`,
                        cy: ''
                    })
                },
                {
                    type: 'number.max',
                    message: localise({
                        en: `Please upload a file below ${FILE_LIMITS.SIZE.label}`,
                        cy: ''
                    })
                }
            ]
        },
        termsAgreement1: {
            name: 'termsAgreement1',
            type: 'checkbox',
            label: localise({
                en: `You have been authorised by the governing body of your organisation (the board or committee that runs your organisation) to submit this application and to accept the Terms and Conditions set out above on their behalf.`,
                cy: ''
            }),
            options: [
                { value: 'yes', label: localise({ en: 'I agree', cy: '' }) }
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.string('yes').required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'You must agree to all of the terms and conditions',
                        cy: ''
                    })
                }
            ]
        },
        termsAgreement2: {
            name: 'termsAgreement2',
            type: 'checkbox',
            label: localise({
                en: `All the information you have provided in your application is accurate and complete; and you will notify us of any changes.`,
                cy: ''
            }),
            options: [
                { value: 'yes', label: localise({ en: 'I agree', cy: '' }) }
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'You must agree to all of the terms and conditions',
                        cy: ''
                    })
                }
            ]
        },
        termsAgreement3: {
            name: 'termsAgreement3',
            type: 'checkbox',
            label: localise({
                en: `You understand that we will use any personal information you have provided for the purposes described under the <a href="/about/customer-service/data-protection">Data Protection Statement</a>.`,
                cy: ''
            }),
            options: [
                { value: 'yes', label: localise({ en: 'I agree', cy: '' }) }
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'You must agree to all of the terms and conditions',
                        cy: ''
                    })
                }
            ]
        },
        termsAgreement4: {
            name: 'termsAgreement4',
            type: 'checkbox',
            label: localise({
                en: `If information about this application is requested under the Freedom of Information Act, we will release it in line with our <a href="/about/customer-service/freedom-of-information">Freedom of Information policy.</a>`,
                cy: ''
            }),
            options: [
                { value: 'yes', label: localise({ en: 'I agree', cy: '' }) }
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'You must agree to all of the terms and conditions',
                        cy: ''
                    })
                }
            ]
        },
        termsPersonName: {
            name: 'termsPersonName',
            label: localise({
                en: 'Full name of person completing this form',
                cy: ''
            }),
            type: 'text',
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en:
                            'You must provide the name of the person completing this form',
                        cy: ''
                    })
                }
            ],
            attributes: { autocomplete: 'name' }
        },
        termsPersonPosition: {
            name: 'termsPersonPosition',
            label: localise({ en: 'Position in organisation', cy: '' }),
            type: 'text',
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en:
                            'You must provide the position of the person completing this form',
                        cy: ''
                    })
                }
            ],
            isRequired: true
        }
    };

    return fields;
};
