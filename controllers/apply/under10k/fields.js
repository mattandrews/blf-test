'use strict';
const get = require('lodash/fp/get');
const moment = require('moment');
const { oneLine } = require('common-tags');

const Joi = require('../lib/joi-extensions-next');

const {
    Field,
    AddressField,
    DateField,
    EmailField,
    NameField,
    PhoneField,
    RadioField,
} = require('../lib/field-types');

const fieldBankAccountName = require('./fields/bank-account-name');
const fieldBankAccountNumber = require('./fields/bank-account-number');
const fieldBankSortCode = require('./fields/bank-sort-code');
const fieldBankStatement = require('./fields/bank-statement');
const fieldBuildingSocietyNumber = require('./fields/building-society-number');
const fieldCharityNumber = require('./fields/charity-number');
const fieldCompanyNumber = require('./fields/company-number');
const fieldContactAddressHistory = require('./fields/contact-address-history');
const fieldContactCommunicationNeeds = require('./fields/contact-communication-needs');
const fieldContactLanguagePreference = require('./fields/contact-language-preference');
const fieldEducationNumber = require('./fields/education-number');
const fieldOrganisationStartDate = require('./fields/organisation-start-date');
const fieldProjectCountry = require('./fields/project-country');
const fieldProjectLocation = require('./fields/project-location');
const fieldProjectLocationDescription = require('./fields/project-location-description');
const fieldProjectName = require('./fields/project-name');
const fieldProjectPostcode = require('./fields/project-postcode');
const fieldProjectBudget = require('./fields/project-budget');
const fieldProjectTotalCosts = require('./fields/project-total-costs');
const fieldSeniorContactRole = require('./fields/senior-contact-role');

const { fieldSupportingCOVID19 } = require('./fields/covid-19');

const {
    fieldBeneficiariesGroups,
    fieldBeneficiariesGroupsAge,
    fieldBeneficiariesGroupsCheck,
    fieldBeneficiariesGroupsDisabledPeople,
    fieldBeneficiariesEthnicBackground,
    fieldBeneficiariesGroupsGender,
    fieldBeneficiariesGroupsOther,
    fieldBeneficiariesGroupsReligion,
    fieldBeneficiariesGroupsReligionOther,
    fieldBeneficiariesNorthernIrelandCommunity,
    fieldBeneficiariesWelshLanguage,
} = require('./fields/beneficiaries');

const {
    fieldProjectStartDateCheck,
    fieldProjectStartDate,
    fieldProjectEndDate,
} = require('./fields/project-dates');

const {
    fieldYourIdeaProject,
    fieldYourIdeaPriorities,
    fieldYourIdeaCommunity,
} = require('./fields/your-idea');

const {
    stripIfExcludedOrgType,
    fieldOrganisationType,
    fieldOrganisationSubTypeStatutoryBody,
} = require('./fields/organisation-type');

const {
    fieldAccountingYearDate,
    fieldTotalIncomeYear,
} = require('./fields/organisation-finances');

const {
    fieldTermsAgreement1,
    fieldTermsAgreement2,
    fieldTermsAgreement3,
    fieldTermsAgreement4,
    fieldTermsAgreementCovid2,
    fieldTermsAgreementCovid3,
    fieldTermsPersonName,
    fieldTermsPersonPosition,
} = require('./fields/terms');

const {
    CONTACT_EXCLUDED_TYPES,
    MIN_AGE_MAIN_CONTACT,
    MIN_AGE_SENIOR_CONTACT,
    FREE_TEXT_MAXLENGTH,
} = require('./constants');

module.exports = function fieldsFor({ locale, data = {}, flags = {} }) {
    const localise = get(locale);

    function dateOfBirthField(name, minAge) {
        const minDate = moment().subtract(120, 'years').format('YYYY-MM-DD');

        const maxDate = moment().subtract(minAge, 'years').format('YYYY-MM-DD');

        return new DateField({
            locale: locale,
            name: name,
            label: localise({ en: 'Date of birth', cy: 'Dyddad geni' }),
            explanation: localise({
                en: `<p>
                    We need their date of birth to help confirm who they are.
                    And we do check their date of birth.
                    So make sure you've entered it right.
                    If you don't, it could delay your application.
                </p>
                <p><strong>For example: 30 03 1980</strong></p>`,
                cy: `<p>
                    Rydym angen eu dyddiad geni i helpu cadarnhau pwy ydynt.
                    Rydym yn gwirio eu dyddiad geni.
                    Felly sicrhewch eich bod wedi ei roi yn gywir.
                    Os nad ydych, gall oedi eich cais.
                </p>
                <p><strong>Er enghraifft: 30 03 1980</strong></p>`,
            }),
            attributes: { max: maxDate },
            schema: stripIfExcludedOrgType(
                CONTACT_EXCLUDED_TYPES,
                Joi.dateParts().minDate(minDate).maxDate(maxDate).required()
            ),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a date of birth',
                        cy: 'Rhowch ddyddiad geni',
                    }),
                },
                {
                    type: 'dateParts.maxDate',
                    message: localise({
                        en: `Must be at least ${minAge} years old`,
                        cy: `Rhaid bod yn o leiaf ${minAge} oed`,
                    }),
                },
                {
                    type: 'dateParts.minDate',
                    message: localise({
                        en: oneLine`Their birth date is not valid—please
                            use four digits, eg. 1986`,
                        cy: oneLine`Nid yw’r dyddiad geni yn ddilys—defnyddiwch
                            bedwar digid, e.e. 1986`,
                    }),
                },
            ],
        });
    }

    const allFields = {
        projectName: fieldProjectName(locale),
        projectCountry: fieldProjectCountry(locale),
        projectLocation: fieldProjectLocation(locale, data),
        projectLocationDescription: fieldProjectLocationDescription(locale),
        supportingCOVID19: fieldSupportingCOVID19(locale),
        projectStartDateCheck: fieldProjectStartDateCheck(locale, data),
        projectStartDate: fieldProjectStartDate(locale, data),
        projectEndDate: fieldProjectEndDate(locale, data, flags),
        projectPostcode: fieldProjectPostcode(locale),
        yourIdeaProject: fieldYourIdeaProject(locale),
        yourIdeaPriorities: fieldYourIdeaPriorities(locale, data, flags),
        yourIdeaCommunity: fieldYourIdeaCommunity(locale),
        projectBudget: fieldProjectBudget(locale),
        projectTotalCosts: fieldProjectTotalCosts(locale, data),
        beneficiariesGroupsCheck: fieldBeneficiariesGroupsCheck(locale),
        beneficiariesGroups: fieldBeneficiariesGroups(locale),
        beneficiariesGroupsOther: fieldBeneficiariesGroupsOther(locale),
        beneficiariesEthnicBackground: fieldBeneficiariesEthnicBackground(
            locale
        ),
        beneficiariesGroupsGender: fieldBeneficiariesGroupsGender(locale),
        beneficiariesGroupsAge: fieldBeneficiariesGroupsAge(locale),
        beneficiariesGroupsDisabledPeople: fieldBeneficiariesGroupsDisabledPeople(
            locale
        ),
        beneficiariesGroupsReligion: fieldBeneficiariesGroupsReligion(locale),
        beneficiariesGroupsReligionOther: fieldBeneficiariesGroupsReligionOther(
            locale
        ),
        beneficiariesWelshLanguage: fieldBeneficiariesWelshLanguage(locale),
        beneficiariesNorthernIrelandCommunity: fieldBeneficiariesNorthernIrelandCommunity(
            locale
        ),
        organisationHasDifferentTradingName: new RadioField({
            locale: locale,
            name: 'organisationHasDifferentTradingName',
            label: localise({
                en: `Does your organisation use a different name in your day-to-day work?`,
                cy: `A yw eich mudiad yn defnyddio enw gwahanol yn eich gwaith dydd i ddydd?`,
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
        }),
        organisationLegalName: new Field({
            locale: locale,
            name: 'organisationLegalName',
            label: localise({
                en: `What is the full legal name of your organisation?`,
                cy: `Beth yw enw cyfreithiol llawn eich sefydliad?`,
            }),
            explanation: localise({
                en: `<p>
                    This must be as shown on your <strong>governing document</strong>.
                    Your governing document could be called one of several things,
                    depending on the type of organisation you're applying on behalf of.
                    It may be called a constitution, trust deed, memorandum and
                    articles of association, or something else entirely.
                </p>`,

                cy: `<p>
                    Rhaid i hwn fod fel y dangosir ar eich <strong>dogfen lywodraethol</strong>.
                    Gall eich dogfen lywodraethol gael ei alw yn un o amryw o bethau,
                    gan ddibynnu ar y math o sefydliad rydych yn ymgeisio ar ei rhan.
                    Gall gael ei alw’n gyfansoddiad, gweithred ymddiriedaeth,
                    memorandwm ac erthyglau cymdeithas, neu rywbeth gwbl wahanol. 
                </p>`,
            }),
            isRequired: true,
            schema: Joi.string().max(FREE_TEXT_MAXLENGTH.large).required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter the full legal name of the organisation',
                        cy: 'Rhowch enw cyfreithiol llawn eich sefydliad',
                    }),
                },
                {
                    type: 'string.max',
                    message: localise({
                        en: `Full legal name of organisation must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i’r enw cyfreithiol llawn fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                    }),
                },
            ],
        }),
        organisationTradingName: new Field({
            locale: locale,
            name: 'organisationTradingName',
            label: localise({
                en: `Tell us the name your organisation uses in your day-to-day work`,
                cy: `Dywedwch wrthym yr enw mae eich mudiad yn ei ddefnyddio yn eich gwaith dydd i ddydd`,
            }),
            get explanation() {
                const organisationLegalName = get('organisationLegalName')(
                    data
                );
                const nameMessage = organisationLegalName
                    ? `, <strong>${organisationLegalName}</strong>`
                    : '';
                return localise({
                    en: `<p>This must be different from your organisation's legal name${nameMessage}.</p>`,
                    cy: `<p>Rhaid i hwn fod yn wahanol i enw cyfreithiol eich mudiad${nameMessage}.</p>`,
                });
            },
            get schema() {
                return Joi.when('organisationHasDifferentTradingName', {
                    is: 'yes',
                    then: Joi.string()
                        .max(FREE_TEXT_MAXLENGTH.large)
                        .required(),
                    otherwise: Joi.any().strip(),
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Please provide your organisation's trading name`,
                        cy: `Darparwch enw masnachu eich mudiad`,
                    }),
                },
                {
                    type: 'string.max',
                    message: localise({
                        en: `Organisation's day-to-day name must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                        cy: `Rhaid i enw dydd i ddydd y sefydliad fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                    }),
                },
            ],
        }),
        organisationStartDate: fieldOrganisationStartDate(locale),
        organisationAddress: new AddressField({
            locale: locale,
            name: 'organisationAddress',
            label: localise({
                en: `What is the main or registered address of your organisation?`,
                cy: `Beth yw prif gyfeiriad neu gyfeiriad gofrestredig eich sefydliad?`,
            }),
            explanation: localise({
                en: `<p>Enter the postcode and search for the address, or enter it manually below.`,
                cy: `Rhowch y cod post a chwiliwch am y cyfeiriad, neu ei deipio isod.`,
            }),
        }),
        organisationType: fieldOrganisationType(locale, data, flags),
        organisationSubTypeStatutoryBody: fieldOrganisationSubTypeStatutoryBody(
            locale
        ),
        companyNumber: fieldCompanyNumber(locale),
        charityNumber: fieldCharityNumber(locale, data),
        educationNumber: fieldEducationNumber(locale),
        accountingYearDate: fieldAccountingYearDate(locale, data),
        totalIncomeYear: fieldTotalIncomeYear(locale, data),
        mainContactName: new NameField({
            locale: locale,
            name: 'mainContactName',
            label: localise({
                en: 'Full name of main contact',
                cy: 'Enw llawn y prif gyswllt',
            }),
            explanation: localise({
                en: 'This person has to live in the UK.',
                cy: 'Rhaid i’r person hwn fyw yn y Deyrnas Unedig.',
            }),
            get warnings() {
                let result = [];

                const seniorSurname = get('seniorContactName.lastName')(data);

                const lastNamesMatch =
                    seniorSurname &&
                    seniorSurname === get('mainContactName.lastName')(data);

                if (lastNamesMatch) {
                    result.push(
                        localise({
                            en: `<span class="js-form-warning-surname">We've noticed that your main and senior contact
                                     have the same surname. Remember we can't fund projects
                                     where the two contacts are married or related by blood.</span>`,
                            cy: `<span class="js-form-warning-surname">Rydym wedi sylwi bod gan eich uwch gyswllt a’ch
                                     prif gyswllt yr un cyfenw. Cofiwch ni allwn ariannu prosiectau
                                     lle mae’r ddau gyswllt yn briod neu’n perthyn drwy waed.</span>`,
                        })
                    );
                }

                return result;
            },
            schema(originalSchema) {
                return originalSchema.compare(Joi.ref('seniorContactName'));
            },
            messages: [
                {
                    type: 'object.isEqual',
                    message: localise({
                        en: `Main contact name must be different from the senior contact's name`,
                        cy: `Rhaid i enw’r prif gyswllt fod yn wahanol i enw’r uwch gyswllt.`,
                    }),
                },
            ],
        }),
        mainContactDateOfBirth: dateOfBirthField(
            'mainContactDateOfBirth',
            MIN_AGE_MAIN_CONTACT
        ),
        mainContactAddress: new AddressField({
            locale: locale,
            name: 'mainContactAddress',
            label: localise({
                en: 'Home address',
                cy: 'Cyfeiriad cartref',
            }),
            explanation: localise({
                en: `We need their home address to help confirm who they are. And we do check their address. So make sure you've entered it right. If you don't, it could delay your application.`,
                cy: `Rydym angen eu cyfeiriad cartref i helpu cadarnhau pwy ydynt. Ac rydym yn gwirio’r cyfeiriad. Felly sicrhewch eich bod wedi’i deipio’n gywir. Os nad ydych, gall oedi eich cais.`,
            }),
            schema: stripIfExcludedOrgType(
                CONTACT_EXCLUDED_TYPES,
                Joi.ukAddress()
                    .required()
                    .compare(Joi.ref('seniorContactAddress'))
            ),
            messages: [
                {
                    type: 'object.isEqual',
                    message: localise({
                        en: `Main contact address must be different from the senior contact's address`,
                        cy: `Rhaid i gyfeiriad y prif gyswllt fod yn wahanol i gyfeiriad yr uwch gyswllt`,
                    }),
                },
            ],
        }),
        mainContactAddressHistory: fieldContactAddressHistory(locale, {
            name: 'mainContactAddressHistory',
        }),
        mainContactEmail: new EmailField({
            locale: locale,
            name: 'mainContactEmail',
            explanation: localise({
                en: `We’ll use this whenever we get in touch about the project`,
                cy: `Fe ddefnyddiwn hwn pryd bynnag y byddwn yn cysylltu ynglŷn â’r prosiect`,
            }),
            schema: Joi.string()
                .required()
                .email()
                .lowercase()
                .invalid(Joi.ref('seniorContactEmail')),
            messages: [
                {
                    type: 'any.invalid',
                    message: localise({
                        en: `Main contact email address must be different from the senior contact's email address`,
                        cy: `Rhaid i gyfeiriad e-bost y prif gyswllt fod yn wahanol i gyfeiriad e-bost yr uwch gyswllt`,
                    }),
                },
            ],
        }),
        mainContactPhone: new PhoneField({
            locale: locale,
            name: 'mainContactPhone',
        }),
        mainContactLanguagePreference: fieldContactLanguagePreference(locale, {
            name: 'mainContactLanguagePreference',
        }),
        mainContactCommunicationNeeds: fieldContactCommunicationNeeds(locale, {
            name: 'mainContactCommunicationNeeds',
        }),
        seniorContactRole: fieldSeniorContactRole(locale, data),
        seniorContactName: new NameField({
            locale: locale,
            name: 'seniorContactName',
            label: localise({
                en: 'Full name of senior contact',
                cy: 'Enw llawn yr uwch gyswllt',
            }),
            explanation: localise({
                en: 'This person has to live in the UK.',
                cy: 'Rhaid i’r person hwn fyw ym Mhrydain',
            }),
        }),
        seniorContactDateOfBirth: dateOfBirthField(
            'seniorContactDateOfBirth',
            MIN_AGE_SENIOR_CONTACT
        ),
        seniorContactAddress: new AddressField({
            locale: locale,
            name: 'seniorContactAddress',
            label: localise({
                en: 'Home address',
                cy: 'Cyfeiriad cartref',
            }),
            explanation: localise({
                en: `We need their home address to help confirm who they are. And we do check their address. So make sure you've entered it right. If you don't, it could delay your application.`,
                cy: `Byddwn angen eu cyfeiriad cartref i helpu cadarnhau pwy ydynt. Ac rydym yn gwirio eu cyfeiriad. Felly sicrhewch eich bod wedi’i deipio’n gywir. Os nad ydych, gall oedi eich cais.`,
            }),
            schema: stripIfExcludedOrgType(
                CONTACT_EXCLUDED_TYPES,
                Joi.ukAddress().required()
            ),
        }),
        seniorContactAddressHistory: fieldContactAddressHistory(locale, {
            name: 'seniorContactAddressHistory',
        }),
        seniorContactEmail: new EmailField({
            locale: locale,
            name: 'seniorContactEmail',
            explanation: localise({
                en: `We’ll use this whenever we get in touch about the project`,
                cy: `Byddwn yn defnyddio hwn pan fyddwn yn cysylltu ynglŷn â’r prosiect`,
            }),
            schema: Joi.string().required().email().lowercase(),
        }),
        seniorContactPhone: new PhoneField({
            locale: locale,
            name: 'seniorContactPhone',
        }),
        seniorContactLanguagePreference: fieldContactLanguagePreference(
            locale,
            {
                name: 'seniorContactLanguagePreference',
            }
        ),
        seniorContactCommunicationNeeds: fieldContactCommunicationNeeds(
            locale,
            {
                name: 'seniorContactCommunicationNeeds',
            }
        ),
        bankAccountName: fieldBankAccountName(locale),
        bankSortCode: fieldBankSortCode(locale),
        bankAccountNumber: fieldBankAccountNumber(locale),
        buildingSocietyNumber: fieldBuildingSocietyNumber(locale),
        bankStatement: fieldBankStatement(locale),
        termsAgreement1: fieldTermsAgreement1(locale),
        termsAgreement2: fieldTermsAgreement2(locale),
        termsAgreement3: fieldTermsAgreement3(locale),
        termsAgreement4: fieldTermsAgreement4(locale),
        termsPersonName: fieldTermsPersonName(locale),
        termsPersonPosition: fieldTermsPersonPosition(locale),
    };

    // Add Covid-19-specific T&C fields if switched on
    if (flags.enableGovCOVIDUpdates) {
        allFields.termsAgreementCovid2 = fieldTermsAgreementCovid2(locale);
        allFields.termsAgreementCovid3 = fieldTermsAgreementCovid3(locale);
    }

    return allFields;
};
