'use strict';
const flatMap = require('lodash/flatMap');
const get = require('lodash/fp/get');
const moment = require('moment');
const { oneLine } = require('common-tags');

const Joi = require('../lib/joi-extensions');

const {
    fieldAccountingYearDate,
    fieldAddressHistory,
    fieldBankAccountName,
    fieldBankAccountNumber,
    fieldBankSortCode,
    fieldBankStatement,
    fieldBuildingSocietyNumber,
    fieldCharityNumber,
    fieldCompanyNumber,
    fieldContactLanguagePreference,
    fieldEducationNumber,
    fieldMainContactAddress,
    fieldMainContactCommunicationNeeds,
    fieldMainContactEmail,
    fieldMainContactName,
    fieldMainContactPhone,
    fieldOrganisationAddress,
    fieldOrganisationLegalName,
    fieldOrganisationStartDate,
    fieldOrganisationTradingName,
    fieldOrganisationType,
    fieldProjectBudget,
    fieldProjectCountry,
    fieldProjectDateRange,
    fieldProjectLocation,
    fieldProjectLocationDescription,
    fieldProjectName,
    fieldProjectPostcode,
    fieldProjectTotalCosts,
    fieldSeniorContactAddress,
    fieldSeniorContactCommunicationNeeds,
    fieldSeniorContactEmail,
    fieldSeniorContactName,
    fieldSeniorContactRole,
    fieldTotalIncomeYear,
    fieldYourIdeaCommunity,
    fieldYourIdeaPriorities,
    fieldYourIdeaProject,
    fieldSeniorContactPhone
} = require('./fields/index');

const { stripIfExcludedOrgType } = require('./lib/schema-helpers');

const {
    BENEFICIARY_GROUPS,
    MIN_AGE_MAIN_CONTACT,
    MIN_AGE_SENIOR_CONTACT,
    ORGANISATION_TYPES,
    STATUTORY_BODY_TYPES,
    FREE_TEXT_MAXLENGTH
} = require('./constants');

module.exports = function fieldsFor({ locale, data = {} }) {
    const localise = get(locale);

    function multiChoice(options) {
        return Joi.array()
            .items(Joi.string().valid(options.map(option => option.value)))
            .single();
    }

    function conditionalBeneficiaryChoice({ match, schema }) {
        return Joi.when(Joi.ref('beneficiariesGroupsCheck'), {
            is: 'yes',
            then: Joi.when(Joi.ref('beneficiariesGroups'), {
                is: Joi.array()
                    .items(
                        Joi.string()
                            .only(match)
                            .required(),
                        Joi.any()
                    )
                    .required(),
                then: schema,
                otherwise: Joi.any().strip()
            }),
            otherwise: Joi.any().strip()
        });
    }

    function dateOfBirthField(minAge, props) {
        const exampleDateFormat = '30 03 1980';
        const defaultProps = {
            explanation: localise({
                en: `
                    <p>
                        We need their date of birth to help confirm who they are.
                        And we do check their date of birth. So make sure you've entered it right.
                        If you don't, it could delay your application.
                    </p>
                    <p>
                        <strong>For example: ${exampleDateFormat}</strong>
                    </p>
                `,
                cy: `
                    <p>
                        Rydym angen eu dyddiad geni i helpu cadarnhau pwy ydynt.
                        Rydym yn gwirio eu dyddiad geni. Felly sicrhewch eich bod wedi ei roi yn gywir.
                        Os nad ydych, gall oedi eich cais.
                    </p>
                    <p>
                        <strong>Er enghraifft: ${exampleDateFormat}</strong>
                    </p>`
            }),
            type: 'date',
            attributes: {
                max: moment()
                    .subtract(minAge, 'years')
                    .format('YYYY-MM-DD')
            },
            isRequired: true,
            schema: stripIfExcludedOrgType(
                Joi.dateParts()
                    .dob(minAge)
                    .required()
            ),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a date of birth',
                        cy: 'Rhowch ddyddiad geni'
                    })
                },
                {
                    type: 'any.invalid',
                    message: localise({
                        en: 'Enter a real date',
                        cy: 'Rhowch ddyddiad go iawn'
                    })
                },
                {
                    type: 'dateParts.dob',
                    message: localise({
                        en: `Must be at least ${minAge} years old`,
                        cy: `Rhaid bod yn o leiaf ${minAge} oed`
                    })
                },
                {
                    type: 'dateParts.dob.tooOld',
                    message: localise({
                        en: `Their birth date is not valid—please use four digits, eg. 1986`,
                        cy: `Nid yw’r dyddiad geni yn ddilys—defnyddiwch bedwar digid, e.e. 1986`
                    })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    return {
        projectName: fieldProjectName(locale),
        projectDateRange: fieldProjectDateRange(locale),
        projectCountry: fieldProjectCountry(locale),
        projectLocation: fieldProjectLocation(locale, data),
        projectLocationDescription: fieldProjectLocationDescription(locale),
        projectPostcode: fieldProjectPostcode(locale),
        yourIdeaProject: fieldYourIdeaProject(locale),
        yourIdeaPriorities: fieldYourIdeaPriorities(locale),
        yourIdeaCommunity: fieldYourIdeaCommunity(locale),
        projectBudget: fieldProjectBudget(locale),
        projectTotalCosts: fieldProjectTotalCosts(locale, data),
        beneficiariesGroupsCheck: {
            name: 'beneficiariesGroupsCheck',
            label: localise({
                en: `Is your project open to everyone or is it aimed at a specific group of people?`,
                cy: `A yw eich prosiect yn agored i bawb neu a yw’n targedu grŵp penodol o bobl?`
            }),
            explanation: localise({
                en: `<p>What do we mean by projects for specific groups?</p>
                    <p>
                      A wheelchair sports club is a place for disabled people to play wheelchair sport.
                      So, this is a project that’s specifically for disabled people.
                      Or a group that aims to empower African women in the community—this group is
                      specifically for people from a particular ethnic background.
                    </p>
                    <p>Check the one that applies:</p>`,
                cy: `<p>Beth ydym yn ei olygu gan brosiectau i grwpiau penodol?</p>
                    <p>
                      Mae clwb chwaraeon cadair olwyn yn le i bobl anabl gymryd
                      rhan mewn chwaraeon cadair olwyn. Felly, mae hwn yn brosiect
                      sydd wedi ei ddylunio’n arbennig i bobl anabl. Neu grŵp
                      sydd wedi’i gynllunio i awdurdodi menywod Affricanaidd
                      yn y gymuned – mae’r grŵp hwn yn benodol i bobl o
                      gefndir ethnig arbennig. 
                    </p>
                    <p>Dewiswch y rhai sy’n berthnasol:</p>`
            }),
            type: 'radio',
            options: [
                {
                    value: 'no',
                    label: localise({
                        en: `My project is open to everyone and isn’t aimed at a specific group of people`,
                        cy: `Mae fy mhrosiect yn agored i bawb ac nid yw wedi’i anelu at grŵp penodol o bobl`
                    })
                },
                {
                    value: 'yes',
                    label: localise({
                        en: `My project is aimed at a specific group of people`,
                        cy: `Mae fy mhrosiect wedi’i anelu at grŵp penodol o bobl`
                    })
                }
            ],
            isRequired: true,
            schema: Joi.string()
                .valid(['yes', 'no'])
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select an option',
                        cy: 'Dewis opsiwn'
                    })
                }
            ]
        },
        beneficiariesGroups: {
            name: 'beneficiariesGroups',
            label: localise({
                en: `What specific groups is your project aimed at?`,
                cy: `Pa grwpiau penodol mae eich prosiect wedi’i anelu ar ei gyfer?`
            }),
            explanation: localise({
                en: `Check the boxes that apply:`,
                cy: `Ticiwch y bocsys sy’n berthnasol:`
            }),
            type: 'checkbox',
            options: [
                {
                    value: BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                    label: localise({
                        en: 'People from a particular ethnic background',
                        cy: 'Pobl o gefndir ethnig penodol'
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.GENDER,
                    label: localise({
                        en: 'People of a particular gender',
                        cy: 'Pobl o ryw penodol'
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.AGE,
                    label: localise({
                        en: 'People of a particular age',
                        cy: 'Pobl o oedran penodol'
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                    label: localise({
                        en: 'Disabled people',
                        cy: 'Pobl anabl'
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.RELIGION,
                    label: localise({
                        en: 'People with a particular religious belief',
                        cy: 'Pobl â chred grefyddol penodol'
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.LGBT,
                    label: localise({
                        en: 'Lesbian, gay, or bisexual people',
                        cy: 'Pobl lesbiaid, hoyw neu ddeurywiol'
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.CARING,
                    label: localise({
                        en: `People with caring responsibilities`,
                        cy: `Pobl â chyfrifoldebau gofal`
                    })
                }
            ],
            get schema() {
                return Joi.when('beneficiariesGroupsCheck', {
                    is: 'yes',
                    then: multiChoice(this.options)
                        .required()
                        .when('beneficiariesGroupsOther', {
                            is: Joi.string().required(),
                            then: Joi.optional()
                        }),
                    otherwise: Joi.any().strip()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the specific group(s) of people your project is aimed at`,
                        cy: `Dewiswch y grŵp(iau) o bobl mae eich prosiect wedi'i anelu ar eu cyfer`
                    })
                }
            ]
        },
        beneficiariesGroupsOther: {
            name: 'beneficiariesGroupsOther',
            label: localise({ en: 'Other', cy: 'Arall' }),
            explanation: localise({
                en: `If your project's for a specific group that's not mentioned above, tell us about it here:`,
                cy: `Os yw eich prosiect ar gyfer grŵp penodol sydd heb ei grybwyll uchod, dywedwch wrthym yma:`
            }),
            type: 'text',
            isRequired: false,
            schema: Joi.when('beneficiariesGroupsCheck', {
                is: 'yes',
                then: Joi.string()
                    .allow('')
                    .max(FREE_TEXT_MAXLENGTH.large)
                    .optional(),
                otherwise: Joi.any().strip()
            }),
            messages: [
                {
                    type: 'string.max',
                    message: localise({
                        en: `Other specific groups must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i grwpiau penodol eraill fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`
                    })
                }
            ]
        },
        beneficiariesEthnicBackground: {
            name: 'beneficiariesGroupsEthnicBackground',
            label: localise({
                en: `Ethnic background`,
                cy: 'Cefndir ethnig'
            }),
            explanation: localise({
                en: oneLine`You told us that your project mostly benefits people
                    from a particular ethnic background. Please tell us which one(s).`,
                cy: oneLine`Fe ddywedoch wrthym bod eich prosiect yn bennaf o
                    fudd i bobl o gefndir ethnig penodol. Dywedwch wrthym pa un:`
            }),
            type: 'checkbox',
            optgroups: [
                {
                    label: localise({
                        en: 'White',
                        cy: 'Gwyn'
                    }),
                    options: [
                        {
                            value: 'white-british',
                            label: localise({
                                en: `English / Welsh / Scottish / Northern Irish / British`,
                                cy: `Saesneg / Cymraeg / Albanaidd / Gogledd Iwerddon / Prydeinig`
                            })
                        },
                        {
                            value: 'irish',
                            label: localise({ en: 'Irish', cy: `Gwyddeleg` })
                        },
                        {
                            value: 'gypsy-or-irish-traveller',
                            label: localise({
                                en: 'Gypsy or Irish Traveller',
                                cy: 'Sipsi neu deithiwr Gwyddeleg'
                            })
                        },
                        {
                            value: 'white-other',
                            label: localise({
                                en: 'Any other White background',
                                cy: 'Unrhyw gefndir gwyn arall'
                            })
                        }
                    ]
                },
                {
                    label: localise({
                        en: 'Mixed / Multiple ethnic groups',
                        cy: 'Grwpiau ethnig cymysg / lluosog'
                    }),
                    options: [
                        {
                            value: 'mixed-background',
                            label: localise({
                                en: 'Mixed ethnic background',
                                cy: 'Cefndir ethnig cymysg'
                            }),
                            explanation: localise({
                                en: oneLine`this refers to people whose parents
                                    are of a different ethnic background to each other`,
                                cy: oneLine`mae hyn yn cyfeirio at bobl sydd o
                                    gefndir ethnig gwahanol i’w gilydd`
                            })
                        }
                    ]
                },
                {
                    label: localise({
                        en: 'Asian / Asian British',
                        cy: 'Asiaidd / Asiaidd Brydeinig'
                    }),
                    options: [
                        {
                            value: 'indian',
                            label: localise({ en: 'Indian', cy: 'Indiaidd' })
                        },
                        {
                            value: 'pakistani',
                            label: localise({
                                en: 'Pakistani',
                                cy: 'Pacistanaidd'
                            })
                        },
                        {
                            value: 'bangladeshi',
                            label: localise({
                                en: 'Bangladeshi',
                                cy: 'Bangladeshi'
                            })
                        },
                        {
                            value: 'chinese',
                            label: localise({
                                en: 'Chinese',
                                cy: 'Tsieniaidd'
                            })
                        },
                        {
                            value: 'asian-other',
                            label: localise({
                                en: 'Any other Asian background',
                                cy: 'Unrhyw gefndir Asiaidd arall'
                            })
                        }
                    ]
                },
                {
                    label: localise({
                        en: 'Black / African / Caribbean / Black British',
                        cy: 'Du / Affricanaidd / Caribiaidd / Du Brydeinig'
                    }),
                    options: [
                        {
                            value: 'caribbean',
                            label: localise({
                                en: 'Caribbean',
                                cy: 'Caribiaidd'
                            })
                        },
                        {
                            value: 'african',
                            label: localise({
                                en: 'African',
                                cy: 'Affricanaidd'
                            })
                        },
                        {
                            value: 'black-other',
                            label: localise({
                                en: `Any other Black / African / Caribbean background`,
                                cy: `Unrhyw gefndir Du / Affricanaidd / Caribiaidd arall`
                            })
                        }
                    ]
                },
                {
                    label: localise({
                        en: 'Other ethnic group',
                        cy: 'Grŵp ethnig arall'
                    }),
                    options: [
                        {
                            value: 'arab',
                            label: localise({ en: 'Arab', cy: 'Arabaidd' })
                        },

                        {
                            value: 'other',
                            label: localise({ en: 'Any other', cy: 'Arall' })
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
                        en: oneLine`Select the ethnic background(s) of the
                            people that will benefit from your project`,
                        cy: oneLine`Dewiswch y cefndir(oedd) ethnig o’r bobl
                            fydd yn elwa o’ch prosiect`
                    })
                }
            ]
        },
        beneficiariesGroupsGender: {
            name: 'beneficiariesGroupsGender',
            label: localise({
                en: `Gender`,
                cy: `Rhyw`
            }),
            explanation: localise({
                en: oneLine`You told us that your project mostly benefits people
                    of a particular gender. Please tell us which one(s).`,
                cy: oneLine`Fe ddywedoch wrthym fod eich prosiect o fudd i bobl 
                    o ryw arbennig. Dywedwch wrthym pa rai. `
            }),
            type: 'checkbox',
            options: [
                { value: 'male', label: localise({ en: 'Male', cy: 'Gwryw' }) },
                {
                    value: 'female',
                    label: localise({ en: 'Female', cy: 'Benyw' })
                },
                {
                    value: 'trans',
                    label: localise({ en: 'Trans', cy: 'Traws' })
                },
                {
                    value: 'non-binary',
                    label: localise({ en: 'Non-binary', cy: 'Di-ddeuaidd' })
                },
                {
                    value: 'intersex',
                    label: localise({ en: 'Intersex', cy: 'Rhyngrywiol' })
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
                        en: `Select the gender(s) of the people that will benefit from your project`,
                        cy: `Dewiswch y rhyw(iau) o’r bobl a fydd yn elwa o’ch prosiect`
                    })
                }
            ]
        },
        beneficiariesGroupsAge: {
            name: 'beneficiariesGroupsAge',
            label: localise({
                en: `Age`,
                cy: `Oedran`
            }),
            explanation: localise({
                en: oneLine`You told us that your project mostly benefits people
                    from particular age groups. Please tell us which one(s).`,
                cy: oneLine`Fe ddywedoch wrthym bod eich prosiect yn bennaf yn
                    elwa pobl o grwpiau oedran penodol. Dywedwch wrthym pa rai.`
            }),
            type: 'checkbox',
            options: [
                { value: '0-12', label: '0-12' },
                { value: '13-24', label: '13-24' },
                { value: '25-64', label: '25-64' },
                { value: '65+', label: '65+' }
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
                        en: `Select the age group(s) of the people that will benefit from your project`,
                        cy: `Dewiswch y grŵp(iau) oedran o’r bobl a fydd yn elwa o’ch prosiect`
                    })
                }
            ]
        },
        beneficiariesGroupsDisabledPeople: {
            name: 'beneficiariesGroupsDisabledPeople',
            label: localise({ en: `Disabled people`, cy: 'Pobl anabl' }),
            explanation: localise({
                en: `<p>
                    You told us that your project mostly benefits disabled people.
                    Please tell us which one(s).
                </p>
                <p>
                    We use the definition from the Equality Act 2010,
                    which defines a disabled person as someone who has a
                    mental or physical impairment that has a substantial
                    and long-term adverse effect on their ability to carry
                    out normal day to day activity.
                </p>`,
                cy: `<p>
                    Fe ddywedoch wrthym bod eich prosiect yn bennaf yn
                    elwa pobl anabl. Dywedwch wrthym pa rai. 
                </p>
                <p>
                    Rydym yn defnyddio’r diffiniad o’r Ddeddf Cydraddoldeb 2010,
                    sy’n diffinio person anabl fel rhywun sydd â nam meddyliol
                    neu gorfforol lle mae hynny’n cael effaith niweidiol
                    sylweddol a hirdymor ar eu gallu i gynnal gweithgaredd
                    arferol o ddydd i ddydd. 
                </p>`
            }),

            type: 'checkbox',
            options: [
                {
                    value: 'sensory',
                    label: localise({
                        en: 'Disabled people with sensory impairments',
                        cy: 'Pobl anabl â namau synhwyraidd'
                    }),
                    explanation: localise({
                        en: 'e.g. visual and hearing impairments',
                        cy: 'e.e. namau ar y golwg a’r clyw'
                    })
                },
                {
                    value: 'physical',
                    label: localise({
                        en: `Disabled people with physical impairments`,
                        cy: `Pobl anabl â namau corfforol`
                    }),
                    explanation: localise({
                        en: oneLine`e.g. neuromotor impairments, such as epilepsy
                            and cerebral palsy, or muscular/skeletal conditions,
                            such as missing limbs and arthritis`,
                        cy: oneLine`e.e. namau niwromotor, fel epilepsi a pharlys
                            yr ymennydd, neu chyflyrau cyhyrog/ysgerbydol,
                            fel aelodau ar goll ac arthritis `
                    })
                },
                {
                    value: 'learning',
                    label: localise({
                        en: `Disabled people with learning or mental difficulties`,
                        cy: `Pobl anabl ag anawsterau dysgu neu feddyliol`
                    }),
                    explanation: localise({
                        en: oneLine`e.g. reduced intellectual ability and difficulty
                            with everyday activities or conditions such as autism`,
                        cy: oneLine`e.e. llai o allu deallusol ac anhawster gyda
                            gweithgareddau dydd i ddydd neu gyflyrau fel awtistiaeth`
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
                        en: `Select the disabled people that will benefit from your project`,
                        cy: `Dewiswch y bobl anabl a fydd yn elwa o’ch prosiect`
                    })
                }
            ]
        },
        beneficiariesGroupsReligion: {
            name: 'beneficiariesGroupsReligion',
            label: localise({
                en: `Religion or belief`,
                cy: `Crefydd neu gred`
            }),
            explanation: localise({
                en: oneLine`You have indicated that your project mostly benefits
                    people of a particular religion or belief, please select from the following`,
                cy: oneLine`Rydych wedi datgan bod eich prosiect yn bennaf yn elwa
                    pobl o grefydd neu gred penodol, dewiswch o’r canlynol`
            }),
            type: 'checkbox',
            options: [
                {
                    value: 'buddhist',
                    label: localise({ en: 'Buddhist', cy: 'Bwdhaidd' })
                },
                {
                    value: 'christian',
                    label: localise({ en: 'Christian', cy: 'Cristion' })
                },
                {
                    value: 'jewish',
                    label: localise({ en: 'Jewish', cy: 'Iddew' })
                },
                {
                    value: 'muslim',
                    label: localise({ en: 'Muslim', cy: 'Mwslim' })
                },
                { value: 'sikh', label: localise({ en: 'Sikh', cy: 'Sikh' }) },
                {
                    value: 'no-religion',
                    label: localise({ en: 'No religion', cy: 'Dim crefydd' })
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
                        en: `Select the religion(s) or belief(s) of the people that will benefit from your project`,
                        cy: `Dewiswch grefydd(au) neu gred(oau) y bobl a fydd yn elwa o’ch prosiect`
                    })
                }
            ]
        },
        beneficiariesGroupsReligionOther: {
            name: 'beneficiariesGroupsReligionOther',
            label: localise({ en: 'Other', cy: 'Arall' }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .max(FREE_TEXT_MAXLENGTH.large)
                .optional(),
            messages: [
                {
                    type: 'string.max',
                    message: localise({
                        en: `Other religions or beliefs must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i grefyddau neu gredoau eraill fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`
                    })
                }
            ]
        },
        beneficiariesWelshLanguage: {
            name: 'beneficiariesWelshLanguage',
            label: localise({
                en: `How many of the people who will benefit from your project speak Welsh?`,
                cy: `Faint o’r bobl a fydd yn elwa o’ch prosiect sy’n siarad Cymraeg?`
            }),
            type: 'radio',
            options: [
                {
                    value: 'all',
                    label: localise({ en: 'All', cy: 'Pawb' })
                },
                {
                    value: 'more-than-half',
                    label: localise({
                        en: 'More than half',
                        cy: 'Dros hanner'
                    })
                },
                {
                    value: 'less-than-half',
                    label: localise({
                        en: 'Less than half',
                        cy: 'Llai na hanner'
                    })
                },
                {
                    value: 'none',
                    label: localise({ en: 'None', cy: 'Neb' })
                }
            ],
            isRequired: true,
            get schema() {
                return Joi.when('projectCountry', {
                    is: 'wales',
                    then: Joi.string()
                        .valid(this.options.map(option => option.value))
                        .max(FREE_TEXT_MAXLENGTH.large)
                        .required(),
                    otherwise: Joi.any().strip()
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the amount of people who speak Welsh that will benefit from your project`,
                        cy: `Dewiswch y nifer o bobl sy’n siarad Cymraeg a fydd yn elwa o’ch prosiect`
                    })
                }
            ]
        },
        beneficiariesNorthernIrelandCommunity: {
            name: 'beneficiariesNorthernIrelandCommunity',
            label: localise({
                en: `Which community do the people who will benefit from your project belong to?`,
                cy: `Pa gymuned mae’r bobl a fydd yn elwa o’ch prosiect yn perthyn iddi?`
            }),
            type: 'radio',
            options: [
                {
                    value: 'both-catholic-and-protestant',
                    label: localise({
                        en: 'Both Catholic and Protestant',
                        cy: 'Catholig a phrotestanaidd'
                    })
                },
                {
                    value: 'mainly-protestant',
                    label: localise({
                        en: `Mainly Protestant (more than 60 per cent)`,
                        cy: `Protestanaidd yn bennaf (dros 60 y cant)`
                    })
                },
                {
                    value: 'mainly-catholic',
                    label: localise({
                        en: `Mainly Catholic (more than 60 per cent)`,
                        cy: `Catholig yn bennaf (dros 60 y cant)`
                    })
                },
                {
                    value: 'neither-catholic-or-protestant',
                    label: localise({
                        en: `Neither Catholic or Protestant`,
                        cy: `Ddim yn Gathloig nac yn Brotestanaidd`
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
                    message: localise({
                        en: `Select the community that the people who will benefit from your project belong to`,
                        cy: `Dewiswch y gymuned mae’r pobl a fydd yn elwa o’r prosiect yn byw ynddi`
                    })
                }
            ]
        },
        organisationLegalName: fieldOrganisationLegalName(locale),
        organisationTradingName: fieldOrganisationTradingName(locale),
        organisationStartDate: fieldOrganisationStartDate(locale),
        organisationAddress: fieldOrganisationAddress(locale),
        organisationType: fieldOrganisationType(locale),
        organisationSubTypeStatutoryBody: {
            name: 'organisationSubType',
            label: localise({
                en: 'Tell us what type of statutory body you are',
                cy: 'Dywedwch wrthym pa fath o gorff statudol ydych'
            }),
            type: 'radio',
            options: [
                {
                    value: STATUTORY_BODY_TYPES.PARISH_COUNCIL,
                    label: localise({
                        en: 'Parish Council',
                        cy: 'Cyngor plwyf'
                    })
                },
                {
                    value: STATUTORY_BODY_TYPES.TOWN_COUNCIL,
                    label: localise({
                        en: 'Town Council',
                        cy: 'Cyngor tref'
                    })
                },
                {
                    value: STATUTORY_BODY_TYPES.LOCAL_AUTHORITY,
                    label: localise({
                        en: 'Local Authority',
                        cy: 'Awdurdod lleol'
                    })
                },
                {
                    value: STATUTORY_BODY_TYPES.NHS_TRUST,
                    label: localise({
                        en: 'NHS Trust/Health Authority',
                        cy: 'Ymddiriedaeth GIG/Awdurdod Iechyd'
                    })
                },
                {
                    value: STATUTORY_BODY_TYPES.PRISON_SERVICE,
                    label: localise({
                        en: 'Prison Service',
                        cy: 'Gwasanaeth carchar'
                    })
                },
                {
                    value: STATUTORY_BODY_TYPES.FIRE_SERVICE,
                    label: localise({
                        en: 'Fire Service',
                        cy: 'Gwasanaeth tân'
                    })
                },
                {
                    value: STATUTORY_BODY_TYPES.POLICE_AUTHORITY,
                    label: localise({
                        en: 'Police Authority',
                        cy: 'Awdurdod heddlu'
                    })
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
                        cy: 'Dywedwch wrthym pa fath o gorff statudol ydych'
                    })
                }
            ]
        },
        companyNumber: fieldCompanyNumber(locale),
        charityNumber: fieldCharityNumber(locale, data),
        educationNumber: fieldEducationNumber(locale),
        accountingYearDate: fieldAccountingYearDate(locale),
        totalIncomeYear: fieldTotalIncomeYear(locale),
        mainContactName: fieldMainContactName(locale, data),
        mainContactDateOfBirth: dateOfBirthField(MIN_AGE_MAIN_CONTACT, {
            name: 'mainContactDateOfBirth',
            label: localise({ en: 'Date of birth', cy: 'Dyddiad geni' })
        }),
        mainContactAddress: fieldMainContactAddress(locale),
        mainContactAddressHistory: fieldAddressHistory(
            locale,
            'mainContactAddressHistory'
        ),
        mainContactEmail: fieldMainContactEmail(locale),
        mainContactPhone: fieldMainContactPhone(locale),
        mainContactLanguagePreference: fieldContactLanguagePreference(
            locale,
            'mainContactLanguagePreference'
        ),
        mainContactCommunicationNeeds: fieldMainContactCommunicationNeeds(
            locale
        ),
        seniorContactRole: fieldSeniorContactRole(locale, data),
        seniorContactName: fieldSeniorContactName(locale),
        seniorContactDateOfBirth: dateOfBirthField(MIN_AGE_SENIOR_CONTACT, {
            name: 'seniorContactDateOfBirth',
            label: localise({ en: 'Date of birth', cy: 'Dyddad geni' })
        }),
        seniorContactAddress: fieldSeniorContactAddress(locale),
        seniorContactAddressHistory: fieldAddressHistory(
            locale,
            'seniorContactAddressHistory'
        ),
        seniorContactEmail: fieldSeniorContactEmail(locale),
        seniorContactPhone: fieldSeniorContactPhone(locale),
        seniorContactLanguagePreference: fieldContactLanguagePreference(
            locale,
            'seniorContactLanguagePreference'
        ),
        seniorContactCommunicationNeeds: fieldSeniorContactCommunicationNeeds(
            locale
        ),
        bankAccountName: fieldBankAccountName(locale),
        bankSortCode: fieldBankSortCode(locale),
        bankAccountNumber: fieldBankAccountNumber(locale),
        buildingSocietyNumber: fieldBuildingSocietyNumber(locale),
        bankStatement: fieldBankStatement(locale),
        termsAgreement1: {
            name: 'termsAgreement1',
            type: 'checkbox',
            label: localise({
                en: `You have been authorised by the governing body of your organisation (the board or committee that runs your organisation) to submit this application and to accept the Terms and Conditions set out above on their behalf.`,
                cy:
                    'Rydych wedi cael eich awdurdodi gan gorff lywodraethol eich sefydliad (y bwrdd neu bwyllgor sy’n rhedeg eich sefydliad) i anfon y cais hwn ac i gytuno â’r Telerau ac Amodau wedi ei osod uchod ar eu rhan.'
            }),
            options: [
                {
                    value: 'yes',
                    label: localise({ en: 'I agree', cy: 'Rwy’n cytuno' })
                }
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.string('yes').required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `You must confirm that you're authorised to submit this application`,
                        cy:
                            'Rhaid ichi gadarnhau eich bod wedi cael eich awdurdodi i anfon y cais hwn'
                    })
                }
            ]
        },
        termsAgreement2: {
            name: 'termsAgreement2',
            type: 'checkbox',
            label: localise({
                en: `All the information you have provided in your application is accurate and complete; and you will notify us of any changes.`,
                cy:
                    'Mae pob darn o wybodaeth rydych wedi ei ddarparu yn eich cais yn gywir ac yn gyflawn; a byddwch yn ein hysbysu am unrhyw newidiadau.'
            }),
            options: [
                {
                    value: 'yes',
                    label: localise({ en: 'I agree', cy: 'Rwy’n cytuno' })
                }
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `You must confirm that the information you've provided in this application is accurate`,
                        cy:
                            'Rhaid ichi gadarnhau bod y wybodaeth rydych wedi ei ddarparu yn y cais hwn yn gywir'
                    })
                }
            ]
        },
        termsAgreement3: {
            name: 'termsAgreement3',
            type: 'checkbox',
            label: localise({
                en: `You understand that we will use any personal information you have provided for the purposes described under the <a href="/about/customer-service/data-protection">Data Protection Statement</a>.`,
                cy:
                    'Rydych yn deall y byddwn yn defnyddio unrhyw wybodaeth bersonol rydych wedi ei ddarparu ar gyfer dibenion wedi’i ddisgrifio dan y <a href="/welsh/about/customer-service/data-protection">Datganiad Diogelu Data</a>.'
            }),
            options: [
                {
                    value: 'yes',
                    label: localise({ en: 'I agree', cy: 'Rwy’n cytuno' })
                }
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `You must confirm that you understand how we'll use any personal information you've provided`,
                        cy:
                            'Rhaid ichi gadarnhau eich bod yn deall sut y byddwn yn defnyddio unrhyw wybodaeth bersonol rydych wedi ei ddarparu'
                    })
                }
            ]
        },
        termsAgreement4: {
            name: 'termsAgreement4',
            type: 'checkbox',
            label: localise({
                en: `If information about this application is requested under the Freedom of Information Act, we will release it in line with our <a href="/about/customer-service/freedom-of-information">Freedom of Information policy.</a>`,
                cy:
                    'Os gofynnir am wybodaeth o’r cais hwn o dan y Ddeddf Rhyddid Gwybodaeth, byddwn yn ei ryddhau yn unol â’n <a href="/welsh/about/customer-service/freedom-of-information">Polisi Rhyddid Gwybodaeth.</a>'
            }),
            options: [
                {
                    value: 'yes',
                    label: localise({ en: 'I agree', cy: 'Rwy’n cytuno' })
                }
            ],
            settings: { stackedSummary: true },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `You must confirm that you understand your application is subject to our Freedom of Information policy`,
                        cy:
                            'Rhaid ichi gadarnhau eich bod yn deall bod eich cais yn ddarostyngedig i’n polisi Rhyddid Gwybodaeth'
                    })
                }
            ]
        },
        termsPersonName: {
            name: 'termsPersonName',
            label: localise({
                en: 'Full name of person completing this form',
                cy: 'Enw llawn y person sy’n cwblhau’r ffurflen'
            }),
            type: 'text',
            isRequired: true,
            schema: Joi.string()
                .max(FREE_TEXT_MAXLENGTH.large)
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Enter the full name of the person completing this form`,
                        cy:
                            'Rhowch enw llawn y person sy’n cwblhau’r ffurflen hwn'
                    })
                },
                {
                    type: 'string.max',
                    message: localise({
                        en: `Full name must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i’r enw llawn fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`
                    })
                }
            ],
            attributes: { autocomplete: 'name' }
        },
        termsPersonPosition: {
            name: 'termsPersonPosition',
            label: localise({
                en: 'Position in organisation',
                cy: 'Safle o fewn y sefydliad'
            }),
            type: 'text',
            schema: Joi.string()
                .max(FREE_TEXT_MAXLENGTH.large)
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Enter the position of the person completing this form`,
                        cy: 'Rhowch safle y person sy’n cwblhau’r ffurlfen hwn'
                    })
                },
                {
                    type: 'string.max',
                    message: localise({
                        en: `Position in organisation must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i’r safle o fewn y sefydliad fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`
                    })
                }
            ],
            isRequired: true
        }
    };
};
