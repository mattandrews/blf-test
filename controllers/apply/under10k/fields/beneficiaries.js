'use strict';
const { oneLine } = require('common-tags');
const get = require('lodash/fp/get');
const flatMap = require('lodash/flatMap');

const Joi = require('../../lib/joi-extensions-next');
const { Field, RadioField, CheckboxField } = require('../../lib/field-types');
const { BENEFICIARY_GROUPS, FREE_TEXT_MAXLENGTH } = require('../constants');

function multiChoice(options) {
    return Joi.array()
        .items(Joi.string().valid(...options.map((option) => option.value)))
        .single();
}

function conditionalBeneficiaryChoice({ match, schema }) {
    return Joi.when(Joi.ref('beneficiariesGroupsCheck'), {
        is: 'yes',
        then: Joi.when(Joi.ref('beneficiariesGroups'), {
            is: Joi.array()
                .items(Joi.string().valid(match).required(), Joi.any())
                .required(),
            then: schema,
            otherwise: Joi.any().strip(),
        }),
        otherwise: Joi.any().strip(),
    });
}

module.exports = {
    fieldBeneficiariesGroupsCheck: function (locale) {
        const localise = get(locale);
        return new RadioField({
            locale: locale,
            name: 'beneficiariesGroupsCheck',
            label: localise({
                en: `Is your project open to everyone or is it aimed at a specific group of people?`,
                cy: `A yw eich prosiect yn agored i bawb neu a yw’n targedu grŵp penodol o bobl?`,
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
                    <p>Dewiswch y rhai sy’n berthnasol:</p>`,
            }),
            options: [
                {
                    value: 'no',
                    label: localise({
                        en: `My project is open to everyone and isn’t aimed at a specific group of people`,
                        cy: `Mae fy mhrosiect yn agored i bawb ac nid yw wedi’i anelu at grŵp penodol o bobl`,
                    }),
                },
                {
                    value: 'yes',
                    label: localise({
                        en: `My project is aimed at a specific group of people`,
                        cy: `Mae fy mhrosiect wedi’i anelu at grŵp penodol o bobl`,
                    }),
                },
            ],
            isRequired: true,
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
    fieldBeneficiariesGroups: function (locale) {
        const localise = get(locale);

        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesGroups',
            label: localise({
                en: `What specific groups is your project aimed at?`,
                cy: `Pa grwpiau penodol mae eich prosiect wedi’i anelu ar ei gyfer?`,
            }),
            explanation: localise({
                en: `Check the boxes that apply:`,
                cy: `Ticiwch y bocsys sy’n berthnasol:`,
            }),
            options: [
                {
                    value: BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                    label: localise({
                        en: 'People from a particular ethnic background',
                        cy: 'Pobl o gefndir ethnig penodol',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.GENDER,
                    label: localise({
                        en: 'People of a particular gender',
                        cy: 'Pobl o ryw penodol',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.AGE,
                    label: localise({
                        en: 'People of a particular age',
                        cy: 'Pobl o oedran penodol',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                    label: localise({
                        en: 'Disabled people',
                        cy: 'Pobl anabl',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.RELIGION,
                    label: localise({
                        en: 'People with a particular religious belief',
                        cy: 'Pobl â chred grefyddol penodol',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.LGBT,
                    label: localise({
                        en: 'Lesbian, gay, or bisexual people',
                        cy: 'Pobl lesbiaid, hoyw neu ddeurywiol',
                    }),
                },
                {
                    value: BENEFICIARY_GROUPS.CARING,
                    label: localise({
                        en: `People with caring responsibilities`,
                        cy: `Pobl â chyfrifoldebau gofal`,
                    }),
                },
            ],
            get schema() {
                return Joi.when('beneficiariesGroupsCheck', {
                    is: 'yes',
                    then: multiChoice(this.options)
                        .required()
                        .when('beneficiariesGroupsOther', {
                            is: Joi.string().required(),
                            then: Joi.optional(),
                        }),
                    otherwise: Joi.any().strip(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the specific group(s) of people your project is aimed at`,
                        cy: `Dewiswch y grŵp(iau) o bobl mae eich prosiect wedi'i anelu ar eu cyfer`,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesGroupsOther: function (locale) {
        const localise = get(locale);

        return new Field({
            locale: locale,
            name: 'beneficiariesGroupsOther',
            label: localise({ en: 'Other', cy: 'Arall' }),
            explanation: localise({
                en: `If your project's for a specific group that's not mentioned above, tell us about it here:`,
                cy: `Os yw eich prosiect ar gyfer grŵp penodol sydd heb ei grybwyll uchod, dywedwch wrthym yma:`,
            }),
            isRequired: false,
            schema: Joi.when('beneficiariesGroupsCheck', {
                is: 'yes',
                then: Joi.string()
                    .allow('')
                    .max(FREE_TEXT_MAXLENGTH.large)
                    .optional(),
                otherwise: Joi.any().strip(),
            }),
            messages: [
                {
                    type: 'string.max',
                    message: localise({
                        en: `Other specific groups must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i grwpiau penodol eraill fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesEthnicBackground: function (locale) {
        const localise = get(locale);

        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesGroupsEthnicBackground',
            label: localise({
                en: `Ethnic background`,
                cy: 'Cefndir ethnig',
            }),
            explanation: localise({
                en: oneLine`You told us that your project mostly benefits people
                        from a particular ethnic background. Please tell us which one(s).`,
                cy: oneLine`Fe ddywedoch wrthym bod eich prosiect yn bennaf o
                        fudd i bobl o gefndir ethnig penodol. Dywedwch wrthym pa un:`,
            }),
            optgroups: [
                {
                    label: localise({
                        en: 'White',
                        cy: 'Gwyn',
                    }),
                    options: [
                        {
                            value: 'white-british',
                            label: localise({
                                en: `English / Welsh / Scottish / Northern Irish / British`,
                                cy: `Saesneg / Cymraeg / Albanaidd / Gogledd Iwerddon / Prydeinig`,
                            }),
                        },
                        {
                            value: 'irish',
                            label: localise({ en: 'Irish', cy: `Gwyddeleg` }),
                        },
                        {
                            value: 'gypsy-or-irish-traveller',
                            label: localise({
                                en: 'Gypsy or Irish Traveller',
                                cy: 'Sipsi neu deithiwr Gwyddeleg',
                            }),
                        },
                        {
                            value: 'white-other',
                            label: localise({
                                en: 'Any other White background',
                                cy: 'Unrhyw gefndir gwyn arall',
                            }),
                        },
                    ],
                },
                {
                    label: localise({
                        en: 'Mixed / Multiple ethnic groups',
                        cy: 'Grwpiau ethnig cymysg / lluosog',
                    }),
                    options: [
                        {
                            value: 'mixed-background',
                            label: localise({
                                en: 'Mixed ethnic background',
                                cy: 'Cefndir ethnig cymysg',
                            }),
                            explanation: localise({
                                en: oneLine`this refers to people whose parents
                                        are of a different ethnic background to each other`,
                                cy: oneLine`mae hyn yn cyfeirio at bobl sydd o
                                        gefndir ethnig gwahanol i’w gilydd`,
                            }),
                        },
                    ],
                },
                {
                    label: localise({
                        en: 'Asian / Asian British',
                        cy: 'Asiaidd / Asiaidd Brydeinig',
                    }),
                    options: [
                        {
                            value: 'indian',
                            label: localise({ en: 'Indian', cy: 'Indiaidd' }),
                        },
                        {
                            value: 'pakistani',
                            label: localise({
                                en: 'Pakistani',
                                cy: 'Pacistanaidd',
                            }),
                        },
                        {
                            value: 'bangladeshi',
                            label: localise({
                                en: 'Bangladeshi',
                                cy: 'Bangladeshi',
                            }),
                        },
                        {
                            value: 'chinese',
                            label: localise({
                                en: 'Chinese',
                                cy: 'Tsieniaidd',
                            }),
                        },
                        {
                            value: 'asian-other',
                            label: localise({
                                en: 'Any other Asian background',
                                cy: 'Unrhyw gefndir Asiaidd arall',
                            }),
                        },
                    ],
                },
                {
                    label: localise({
                        en: 'Black / African / Caribbean / Black British',
                        cy: 'Du / Affricanaidd / Caribiaidd / Du Brydeinig',
                    }),
                    options: [
                        {
                            value: 'caribbean',
                            label: localise({
                                en: 'Caribbean',
                                cy: 'Caribiaidd',
                            }),
                        },
                        {
                            value: 'african',
                            label: localise({
                                en: 'African',
                                cy: 'Affricanaidd',
                            }),
                        },
                        {
                            value: 'black-other',
                            label: localise({
                                en: `Any other Black / African / Caribbean background`,
                                cy: `Unrhyw gefndir Du / Affricanaidd / Caribiaidd arall`,
                            }),
                        },
                    ],
                },
                {
                    label: localise({
                        en: 'Other ethnic group',
                        cy: 'Grŵp ethnig arall',
                    }),
                    options: [
                        {
                            value: 'arab',
                            label: localise({ en: 'Arab', cy: 'Arabaidd' }),
                        },

                        {
                            value: 'other',
                            label: localise({ en: 'Any other', cy: 'Arall' }),
                        },
                    ],
                },
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                    schema: multiChoice(
                        flatMap(this.optgroups, (o) => o.options)
                    ).required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: oneLine`Select the ethnic background(s) of the
                                people that will benefit from your project`,
                        cy: oneLine`Dewiswch y cefndir(oedd) ethnig o’r bobl
                                fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesGroupsGender: function (locale) {
        const localise = get(locale);
        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesGroupsGender',
            label: localise({
                en: `Gender`,
                cy: `Rhyw`,
            }),
            explanation: localise({
                en: oneLine`You told us that your project mostly benefits people
                        of a particular gender. Please tell us which one(s).`,
                cy: oneLine`Fe ddywedoch wrthym fod eich prosiect o fudd i bobl 
                        o ryw arbennig. Dywedwch wrthym pa rai. `,
            }),
            options: [
                { value: 'male', label: localise({ en: 'Male', cy: 'Gwryw' }) },
                {
                    value: 'female',
                    label: localise({ en: 'Female', cy: 'Benyw' }),
                },
                {
                    value: 'trans',
                    label: localise({ en: 'Trans', cy: 'Traws' }),
                },
                {
                    value: 'non-binary',
                    label: localise({ en: 'Non-binary', cy: 'Di-ddeuaidd' }),
                },
                {
                    value: 'intersex',
                    label: localise({ en: 'Intersex', cy: 'Rhyngrywiol' }),
                },
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.GENDER,
                    schema: multiChoice(this.options).required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the gender(s) of the people that will benefit from your project`,
                        cy: `Dewiswch y rhyw(iau) o’r bobl a fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesGroupsAge: function (locale) {
        const localise = get(locale);

        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesGroupsAge',
            label: localise({
                en: `Age`,
                cy: `Oedran`,
            }),
            explanation: localise({
                en: oneLine`You told us that your project mostly benefits people
                        from particular age groups. Please tell us which one(s).`,
                cy: oneLine`Fe ddywedoch wrthym bod eich prosiect yn bennaf yn
                        elwa pobl o grwpiau oedran penodol. Dywedwch wrthym pa rai.`,
            }),
            options: [
                { value: '0-12', label: '0-12' },
                { value: '13-24', label: '13-24' },
                { value: '25-64', label: '25-64' },
                { value: '65+', label: '65+' },
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.AGE,
                    schema: multiChoice(this.options).required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the age group(s) of the people that will benefit from your project`,
                        cy: `Dewiswch y grŵp(iau) oedran o’r bobl a fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesGroupsDisabledPeople: function (locale) {
        const localise = get(locale);
        return new CheckboxField({
            locale: locale,
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
                </p>`,
            }),
            options: [
                {
                    value: 'sensory',
                    label: localise({
                        en: 'Disabled people with sensory impairments',
                        cy: 'Pobl anabl â namau synhwyraidd',
                    }),
                    explanation: localise({
                        en: 'e.g. visual and hearing impairments',
                        cy: 'e.e. namau ar y golwg a’r clyw',
                    }),
                },
                {
                    value: 'physical',
                    label: localise({
                        en: `Disabled people with physical impairments`,
                        cy: `Pobl anabl â namau corfforol`,
                    }),
                    explanation: localise({
                        en: oneLine`e.g. neuromotor impairments, such as epilepsy
                            and cerebral palsy, or muscular/skeletal conditions,
                            such as missing limbs and arthritis`,
                        cy: oneLine`e.e. namau niwromotor, fel epilepsi a pharlys
                            yr ymennydd, neu chyflyrau cyhyrog/ysgerbydol,
                            fel aelodau ar goll ac arthritis `,
                    }),
                },
                {
                    value: 'learning',
                    label: localise({
                        en: `Disabled people with learning or mental difficulties`,
                        cy: `Pobl anabl ag anawsterau dysgu neu feddyliol`,
                    }),
                    explanation: localise({
                        en: oneLine`e.g. reduced intellectual ability and difficulty
                            with everyday activities or conditions such as autism`,
                        cy: oneLine`e.e. llai o allu deallusol ac anhawster gyda
                            gweithgareddau dydd i ddydd neu gyflyrau fel awtistiaeth`,
                    }),
                },
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                    schema: multiChoice(this.options).required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the disabled people that will benefit from your project`,
                        cy: `Dewiswch y bobl anabl a fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesGroupsReligion: function (locale) {
        const localise = get(locale);
        return new CheckboxField({
            locale: locale,
            name: 'beneficiariesGroupsReligion',
            label: localise({
                en: `Religion or belief`,
                cy: `Crefydd neu gred`,
            }),
            explanation: localise({
                en: oneLine`You have indicated that your project mostly benefits
                    people of a particular religion or belief, please select from the following`,
                cy: oneLine`Rydych wedi datgan bod eich prosiect yn bennaf yn elwa
                    pobl o grefydd neu gred penodol, dewiswch o’r canlynol`,
            }),
            options: [
                {
                    value: 'buddhist',
                    label: localise({ en: 'Buddhist', cy: 'Bwdhaidd' }),
                },
                {
                    value: 'christian',
                    label: localise({ en: 'Christian', cy: 'Cristion' }),
                },
                {
                    value: 'jewish',
                    label: localise({ en: 'Jewish', cy: 'Iddew' }),
                },
                {
                    value: 'muslim',
                    label: localise({ en: 'Muslim', cy: 'Mwslim' }),
                },
                { value: 'sikh', label: localise({ en: 'Sikh', cy: 'Sikh' }) },
                {
                    value: 'no-religion',
                    label: localise({ en: 'No religion', cy: 'Dim crefydd' }),
                },
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.RELIGION,
                    schema: multiChoice(this.options).required(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the religion(s) or belief(s) of the people that will benefit from your project`,
                        cy: `Dewiswch grefydd(au) neu gred(oau) y bobl a fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesGroupsReligionOther: function (locale) {
        const localise = get(locale);
        return new Field({
            locale: locale,
            name: 'beneficiariesGroupsReligionOther',
            label: localise({ en: 'Other', cy: 'Arall' }),
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
                        cy: `Rhaid i grefyddau neu gredoau eraill fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesWelshLanguage: function (locale) {
        const localise = get(locale);
        return new RadioField({
            locale: locale,
            name: 'beneficiariesWelshLanguage',
            label: localise({
                en: `How many of the people who will benefit from your project speak Welsh?`,
                cy: `Faint o’r bobl a fydd yn elwa o’ch prosiect sy’n siarad Cymraeg?`,
            }),
            options: [
                {
                    value: 'all',
                    label: localise({ en: 'All', cy: 'Pawb' }),
                },
                {
                    value: 'more-than-half',
                    label: localise({
                        en: 'More than half',
                        cy: 'Dros hanner',
                    }),
                },
                {
                    value: 'less-than-half',
                    label: localise({
                        en: 'Less than half',
                        cy: 'Llai na hanner',
                    }),
                },
                {
                    value: 'none',
                    label: localise({ en: 'None', cy: 'Neb' }),
                },
            ],
            isRequired: true,
            get schema() {
                return Joi.when('projectCountry', {
                    is: 'wales',
                    then: Joi.string()
                        .valid(...this.options.map((option) => option.value))
                        .max(FREE_TEXT_MAXLENGTH.large)
                        .required(),
                    otherwise: Joi.any().strip(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the amount of people who speak Welsh that will benefit from your project`,
                        cy: `Dewiswch y nifer o bobl sy’n siarad Cymraeg a fydd yn elwa o’ch prosiect`,
                    }),
                },
            ],
        });
    },
    fieldBeneficiariesNorthernIrelandCommunity: function (locale) {
        const localise = get(locale);
        return new RadioField({
            locale: locale,
            name: 'beneficiariesNorthernIrelandCommunity',
            label: localise({
                en: `Which community do the people who will benefit from your project belong to?`,
                cy: `Pa gymuned mae’r bobl a fydd yn elwa o’ch prosiect yn perthyn iddi?`,
            }),
            options: [
                {
                    value: 'both-catholic-and-protestant',
                    label: localise({
                        en: 'Both Catholic and Protestant',
                        cy: 'Catholig a phrotestanaidd',
                    }),
                },
                {
                    value: 'mainly-protestant',
                    label: localise({
                        en: `Mainly Protestant (more than 60 per cent)`,
                        cy: `Protestanaidd yn bennaf (dros 60 y cant)`,
                    }),
                },
                {
                    value: 'mainly-catholic',
                    label: localise({
                        en: `Mainly Catholic (more than 60 per cent)`,
                        cy: `Catholig yn bennaf (dros 60 y cant)`,
                    }),
                },
                {
                    value: 'neither-catholic-or-protestant',
                    label: localise({
                        en: `Neither Catholic or Protestant`,
                        cy: `Ddim yn Gathloig nac yn Brotestanaidd`,
                    }),
                },
            ],
            isRequired: true,
            get schema() {
                return Joi.when('projectCountry', {
                    is: 'northern-ireland',
                    then: Joi.string()
                        .valid(...this.options.map((option) => option.value))
                        .required(),
                    otherwise: Joi.any().strip(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Select the community that the people who will benefit from your project belong to`,
                        cy: `Dewiswch y gymuned mae’r pobl a fydd yn elwa o’r prosiect yn byw ynddi`,
                    }),
                },
            ],
        });
    },
};
