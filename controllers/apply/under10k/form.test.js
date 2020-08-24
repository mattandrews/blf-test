/* eslint-env jest */
'use strict';
const faker = require('faker');
const moment = require('moment');
const omit = require('lodash/omit');
const sample = require('lodash/sample');

const formBuilder = require('./form');

const {
    mockAddress,
    mockBeneficiaries,
    mockDateOfBirth,
    mockResponse,
    toDateParts,
} = require('./mocks');

function mapMessages(validationResult) {
    return validationResult.messages.map((item) => item.msg);
}

function mapMessageSummary(validationResult) {
    return validationResult.messages.map(function (item) {
        return `${item.param}: ${item.msg}`;
    });
}

function fieldsForStep(form, sectionSlug, stepIndex) {
    return form
        .getStep(sectionSlug, stepIndex)
        .getCurrentFields()
        .map((field) => field.name);
}

test('empty form', () => {
    const form = formBuilder();
    expect(mapMessageSummary(form.validation)).toMatchSnapshot();
    expect(form.progress).toMatchSnapshot();
});

/**
 * Used to test common invalid values in favour of individual test cases
 * This is much faster as it allows us to snapshot a number of error messages at once
 * without building a new form model each time
 */
test('invalid form', () => {
    const matchingName = { firstName: 'Alice', lastName: 'Example' };
    const matchingAddress = {
        line1: 'National Lottery Community Fund',
        line2: 'Apex House',
        county: 'West Midlands',
        postcode: 'B15 1TR',
        townCity: 'BIRMINGHAM',
    };

    const data = mockResponse({
        projectName: `This name will be too long ${faker.lorem.words(50)}`,
        projectDateRange: {
            startDate: { day: 31, month: 1, year: 2020 },
            endDate: { day: 31, month: 1, year: 2019 },
        },
        projectPostcode: 'not a postcode',
        projectBudget: [
            { item: faker.lorem.words(5), cost: 5000 },
            { item: faker.lorem.words(5), cost: 5100 },
        ], // over the limit
        projectTotalCosts: 1000, // lower than budget
        yourIdeaProject: faker.lorem.words(301), // over word-count
        yourIdeaPriorities: faker.lorem.words(151), // over word-count
        yourIdeaCommunity: faker.lorem.words(201), // over word-count
        seniorContactName: matchingName,
        mainContactName: matchingName,
        seniorContactAddress: matchingAddress,
        mainContactAddress: matchingAddress,
        seniorContactRole: 'not-a-real-role',
        seniorContactAddressHistory: {
            currentAddressMeetsMinimum: 'no',
            previousAddress: null, // address history required
        },
        mainContactAddressHistory: {
            currentAddressMeetsMinimum: 'no',
            previousAddress: {
                line1: faker.address.streetAddress(),
                townCity: faker.address.city(),
            }, // partial address
        },
        seniorContactEmail: 'example@example.com',
        mainContactEmail: 'Example@example.com', // emails must not match (case-insensitive)
        seniorContactPhone: 'not a phone number',
        mainContactPhone: 'not a phone number',
        seniorContactDateOfBirth: mockDateOfBirth(0, 17), // too young,
        mainContactDateOfBirth: mockDateOfBirth(0, 15), // too young
    });

    const form = formBuilder({ data });

    expect(mapMessageSummary(form.validation)).toMatchSnapshot();

    // Check list of featured messages
    const featuredMessages = form.validation.featuredMessages.map(
        (item) => item.msg
    );

    expect(featuredMessages).toMatchSnapshot();
});

test('valid form for england', () => {
    const data = mockResponse({
        projectCountry: 'england',
        projectLocation: 'derbyshire',
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeUndefined();
});

test('valid form for scotland', () => {
    const data = mockResponse({
        projectCountry: 'scotland',
        projectLocation: 'east-lothian',
        supportingCOVID19: 'yes',
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeUndefined();
});

test('valid form for wales', () => {
    const data = mockResponse({
        projectCountry: 'wales',
        projectLocation: 'caerphilly',
        supportingCOVID19: 'no',
        // Additional questions required in Wales
        beneficiariesWelshLanguage: 'all',
        mainContactLanguagePreference: 'welsh',
        seniorContactLanguagePreference: 'welsh',
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeUndefined();

    // Test for existence of country specific fields
    expect(form.getCurrentFields().map((field) => field.name)).toEqual(
        expect.arrayContaining([
            'beneficiariesWelshLanguage',
            'mainContactLanguagePreference',
            'seniorContactLanguagePreference',
        ])
    );
});

test('valid form for northern-ireland', () => {
    const data = mockResponse({
        projectCountry: 'northern-ireland',
        projectLocation: 'mid-ulster',
        supportingCOVID19: 'no',
        // Additional questions required in Northern-Ireland
        beneficiariesNorthernIrelandCommunity: 'mainly-catholic',
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeUndefined();

    // Test for existence of country specific fields
    expect(form.getCurrentFields().map((field) => field.name)).toEqual(
        expect.arrayContaining(['beneficiariesNorthernIrelandCommunity'])
    );
});

function mapRegistrationFieldNames(form) {
    return form
        .getStep('organisation', 4)
        .getCurrentFields()
        .map((field) => field.name);
}

test('valid form for unregistered-vco', function () {
    const data = mockResponse({
        organisationType: 'unregistered-vco',
        seniorContactRole: 'chair',
        // No registration numbers required
        companyNumber: null,
        charityNumber: null,
        educationNumber: null,
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeUndefined();
});

test('valid form for unincorporated-registered-charity', function () {
    const data = mockResponse({
        organisationType: 'unincorporated-registered-charity',
        charityNumber: '12345678',
        seniorContactRole: 'trustee',
    });

    const form = formBuilder({ data });

    expect(form.validation.error).toBeUndefined();

    expect(mapRegistrationFieldNames(form)).toEqual(['charityNumber']);

    const invalidData = mockResponse({
        organisationType: 'unincorporated-registered-charity',
        charityNumber: null,
    });

    const invalidForm = formBuilder({ data: invalidData });

    expect(mapMessages(invalidForm.validation)).toEqual(
        expect.arrayContaining([
            expect.stringContaining('Enter your organisation’s charity number'),
        ])
    );
});

test('valid form for charitable-incorporated-organisation', function () {
    const data = mockResponse({
        organisationType: 'charitable-incorporated-organisation',
        charityNumber: '12345678',
        seniorContactRole: 'trustee',
    });

    const form = formBuilder({ data });

    expect(form.validation.error).toBeUndefined();

    expect(mapRegistrationFieldNames(form)).toEqual(['charityNumber']);

    const invalidData = mockResponse({
        organisationType: 'charitable-incorporated-organisation',
        charityNumber: null,
    });

    const invalidForm = formBuilder({ data: invalidData });

    expect(mapMessages(invalidForm.validation)).toEqual(
        expect.arrayContaining([
            expect.stringContaining('Enter your organisation’s charity number'),
        ])
    );
});

test('valid form for not-for-profit-company', function () {
    const form = formBuilder({
        data: mockResponse({
            organisationType: 'not-for-profit-company',
            seniorContactRole: 'company-director',
            companyNumber: '12345678',
            charityNumber: '',
        }),
    });

    const formWithCharityNumber = formBuilder({
        data: mockResponse({
            organisationType: 'not-for-profit-company',
            seniorContactRole: 'company-director',
            // Allow company number or charity number
            companyNumber: '12345678',
            charityNumber: '1234567',
        }),
    });

    expect(form.validation.error).toBeUndefined();
    expect(formWithCharityNumber.validation.error).toBeUndefined();

    expect(mapRegistrationFieldNames(form)).toEqual([
        'companyNumber',
        'charityNumber',
    ]);

    const invalidData = mockResponse({
        organisationType: 'not-for-profit-company',
        companyNumber: null,
    });

    const invalidForm = formBuilder({ data: invalidData });

    expect(mapMessages(invalidForm.validation)).toEqual(
        expect.arrayContaining([
            expect.stringContaining(
                'Enter your organisation’s Companies House number'
            ),
        ])
    );
});

test('valid form for community-interest-company', function () {
    const data = mockResponse({
        organisationType: 'community-interest-company',
        companyNumber: '12345678',
        seniorContactRole: 'company-director',
    });

    const form = formBuilder({ data });

    expect(form.validation.error).toBeUndefined();

    expect(mapRegistrationFieldNames(form)).toEqual(['companyNumber']);

    const invalidData = mockResponse({
        organisationType: 'community-interest-company',
        companyNumber: null,
    });

    const invalidForm = formBuilder({ data: invalidData });

    expect(mapMessages(invalidForm.validation)).toEqual(
        expect.arrayContaining([
            expect.stringContaining(
                'Enter your organisation’s Companies House number'
            ),
        ])
    );
});

test('valid form for school', function () {
    const data = mockResponse({
        projectCountry: 'scotland',
        projectLocation: 'fife',
        supportingCOVID19: 'no',
        organisationType: 'school',
        educationNumber: '345678',
        seniorContactRole: 'head-teacher',
    });

    const form = formBuilder({ data });

    expect(form.validation.error).toBeUndefined();

    const invalidData = mockResponse({
        organisationType: 'school',
        educationNumber: null,
    });

    const invalidForm = formBuilder({ data: invalidData });

    expect(mapRegistrationFieldNames(invalidForm)).toEqual(['educationNumber']);

    expect(mapMessages(invalidForm.validation)).toEqual(
        expect.arrayContaining([
            expect.stringContaining(
                'Enter your organisation’s Department for Education number'
            ),
        ])
    );
});

test('valid form for college-or-university', function () {
    const data = mockResponse({
        projectCountry: 'scotland',
        projectLocation: 'fife',
        supportingCOVID19: 'no',
        organisationType: 'college-or-university',
        educationNumber: '345678',
        seniorContactRole: 'chancellor',
    });

    const form = formBuilder({ data });

    expect(form.validation.error).toBeUndefined();

    const invalidData = mockResponse({
        organisationType: 'college-or-university',
        educationNumber: null,
    });

    const invalidForm = formBuilder({ data: invalidData });

    expect(mapRegistrationFieldNames(invalidForm)).toEqual(['educationNumber']);

    expect(mapMessages(invalidForm.validation)).toEqual(
        expect.arrayContaining([
            expect.stringContaining(
                'Enter your organisation’s Department for Education number'
            ),
        ])
    );
});

test('valid form for statutory-body', function () {
    const data = mockResponse({
        projectCountry: 'scotland',
        projectLocation: 'fife',
        supportingCOVID19: 'no',
        organisationType: 'statutory-body',
        organisationSubType: 'parish-council',
        seniorContactRole: 'parish-clerk',
        // No registration numbers required
        companyNumber: null,
        charityNumber: null,
        educationNumber: null,
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeUndefined();
});

test.each(['school', 'college-or-university', 'statutory-body'])(
    '%p not allowed in England',
    function (orgType) {
        const data = mockResponse({
            projectCountry: 'england',
            organisationType: orgType,
        });

        const result = formBuilder({
            data,
            flags: { enableGovCOVIDUpdates: true },
        }).validation;

        expect(mapMessages(result)).toEqual(
            expect.arrayContaining([
                expect.stringContaining('Select a type of organisation'),
            ])
        );
    }
);

test('role can be free text for some statutory bodies', function () {
    const data = mockResponse({
        projectCountry: 'scotland',
        projectLocation: 'fife',
        supportingCOVID19: 'no',
        organisationType: 'statutory-body',
        organisationSubType: sample([
            'prison-service',
            'fire-service',
            'police-authority',
        ]),
        seniorContactRole: faker.lorem.words(20),
        // No registration numbers required
        companyNumber: null,
        charityNumber: null,
        educationNumber: null,
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeUndefined();
});

test('valid form for faith-group', function () {
    const form = formBuilder({
        data: mockResponse({
            organisationType: 'faith-group',
            seniorContactRole: 'religious-leader',
        }),
    });

    expect(form.validation.error).toBeUndefined();

    const formWithCharityNumber = formBuilder({
        data: mockResponse({
            organisationType: 'faith-group',
            seniorContactRole: 'religious-leader',
            charityNumber: '1234567',
        }),
    });

    expect(formWithCharityNumber.validation.error).toBeUndefined();

    expect(mapRegistrationFieldNames(form)).toEqual(['charityNumber']);
});

test('disallow letter O in charity number', function () {
    const data = mockResponse({
        organisationType: 'unincorporated-registered-charity',
        charityNumber: 'SCO123',
    });

    const result = formBuilder({ data }).validation;

    expect(mapMessages(result)).toEqual(
        expect.arrayContaining([
            expect.stringContaining(
                'use the number ‘0’ in ‘SC0’ instead of the letter ‘O’'
            ),
        ])
    );
});

test('disallow too-short charity number', function () {
    const data = mockResponse({
        organisationType: 'unincorporated-registered-charity',
        charityNumber: 'N/A',
    });

    const result = formBuilder({ data }).validation;

    expect(mapMessages(result)).toEqual(
        expect.arrayContaining([
            expect.stringContaining('Enter your organisation’s charity number'),
        ])
    );
});

test('valid form for different trading names', function () {
    const data = mockResponse({
        organisationLegalName: 'Cheap Meat For School Dinners',
        organisationHasDifferentTradingName: 'yes',
        organisationTradingName: 'Hamsters For All',
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeUndefined();

    const invalidData = mockResponse({
        organisationLegalName: 'Balloon Rides For Sad Polar Bears',
        organisationHasDifferentTradingName: 'yes',
        organisationTradingName: null,
    });

    const invalidForm = formBuilder({ data: invalidData });

    expect(mapMessages(invalidForm.validation)).toEqual(
        expect.arrayContaining([
            expect.stringContaining(
                `Please provide your organisation's trading name`
            ),
        ])
    );
});

test('maintain backwards compatibility for date schema', function () {
    const mock = mockResponse({
        projectCountry: 'scotland',
        projectLocation: 'fife',
        supportingCOVID19: 'no',
        projectStartDate: { day: 3, month: 3, year: 2021 },
        projectEndDate: { day: 3, month: 4, year: 2021 },
    });

    const form = formBuilder({
        data: omit(mock, 'projectStartDateCheck'),
    });

    expect(form.validation.error).toBeUndefined();

    // Maintain backwards compatibility with salesforce schema
    const salesforceResult = form.forSalesforce();
    expect(salesforceResult.projectStartDate).toBe('2021-03-03');
    expect(salesforceResult.projectEndDate).toBe('2021-04-03');
    expect(salesforceResult.projectDateRange).toEqual({
        startDate: '2021-03-03',
        endDate: '2021-04-03',
    });
});

test('require project dates', function () {
    const form = formBuilder({
        data: {
            projectCountry: 'scotland',
            supportingCOVID19: 'no',
        },
    });

    expect(mapMessages(form.validation)).toEqual(
        expect.arrayContaining([
            'Enter a project start date',
            'Enter a project end date',
        ])
    );
});

test('start date defaults to current date if specifying as soon as possible', function () {
    const projectStartDate = moment();
    const projectEndDate = moment().add('3', 'days');

    const mock = mockResponse({
        projectCountry: 'england',
        projectStartDateCheck: 'asap',
        projectEndDate: toDateParts(projectEndDate),
    });

    const data = omit(mock, ['projectStartDate']);

    const form = formBuilder({
        data,
        flags: { enableEnglandAutoEndDate: false },
    });

    expect(form.validation.error).toBeUndefined();

    const salesforceResult = form.forSalesforce();

    const expectedProjectStartDate = projectStartDate.format('YYYY-MM-DD');
    const expectedProjectEndDate = projectEndDate.format('YYYY-MM-DD');

    expect(salesforceResult.projectStartDate).toBe(expectedProjectStartDate);
    expect(salesforceResult.projectEndDate).toBe(expectedProjectEndDate);
    expect(salesforceResult.projectDateRange).toEqual({
        startDate: expectedProjectStartDate,
        endDate: expectedProjectEndDate,
    });
});

test('end date pre-filled to 6 months from now if specifying asap in England', function () {
    const mock = mockResponse({
        projectCountry: 'england',
        projectStartDateCheck: 'asap',
    });

    const data = omit(mock, ['projectStartDate', 'projectEndDate']);

    const form = formBuilder({ data });

    expect(form.validation.error).toBeUndefined();

    const salesforceResult = form.forSalesforce();

    const expectedProjectStartDate = moment().format('YYYY-MM-DD');
    const expectedProjectEndDate = moment()
        .add('6', 'months')
        .format('YYYY-MM-DD');

    expect(salesforceResult.projectStartDate).toBe(expectedProjectStartDate);
    expect(salesforceResult.projectEndDate).toBe(expectedProjectEndDate);

    expect(salesforceResult.projectDateRange).toEqual({
        startDate: expectedProjectStartDate,
        endDate: expectedProjectEndDate,
    });
});

test('start date must be at least 12 weeks away outside England when not supporting COVID-19', function () {
    function expectStartDateForCountry(countryData) {
        const invalidData = mockResponse({
            ...countryData,
            ...{
                supportingCOVID19: 'no',
                projectStartDate: toDateParts(moment().add('11', 'weeks')),
                projectEndDate: toDateParts(moment().add('11', 'weeks')),
            },
        });

        const invalidForm = formBuilder({
            data: omit(invalidData, 'projectStartDateCheck'),
        });

        expect(mapMessages(invalidForm.validation)).toEqual(
            expect.arrayContaining([
                expect.stringMatching(
                    /Date you start the project must be on or after/
                ),
            ])
        );

        const validData = mockResponse({
            ...countryData,
            ...{
                supportingCOVID19: 'no',
                projectStartDate: toDateParts(moment().add('12', 'weeks')),
                projectEndDate: toDateParts(moment().add('12', 'weeks')),
            },
        });

        const validForm = formBuilder({
            data: omit(validData, 'projectStartDateCheck'),
        });

        expect(validForm.validation.error).toBeUndefined();
    }

    expectStartDateForCountry({
        projectCountry: 'northern-ireland',
        projectLocation: 'derry-and-strabane',
        beneficiariesNorthernIrelandCommunity: 'mainly-catholic',
    });

    expectStartDateForCountry({
        projectCountry: 'scotland',
        projectLocation: 'fife',
    });

    expectStartDateForCountry({
        projectCountry: 'wales',
        projectLocation: 'monmouthshire',
        beneficiariesWelshLanguage: 'all',
        mainContactLanguagePreference: 'welsh',
        seniorContactLanguagePreference: 'welsh',
    });
});

test('require beneficiary groups when check is "yes"', () => {
    const data = mockResponse({
        beneficiariesGroupsCheck: 'yes',
        beneficiariesGroups: null,
        beneficiariesGroupsOther: null,
    });

    const result = formBuilder({ data }).validation;

    expect(mapMessages(result)).toEqual(
        expect.arrayContaining([
            expect.stringContaining('Select the specific group'),
        ])
    );
});

test('require additional beneficiary questions based on groups', () => {
    const data = mockResponse({
        beneficiariesGroupsCheck: 'yes',
        beneficiariesGroups: [
            'ethnic-background',
            'gender',
            'age',
            'disabled-people',
            'religion',
            'lgbt',
            'caring-responsibilities',
        ],
        beneficiariesGroupsOther: null,
        beneficiariesGroupsEthnicBackground: null,
        beneficiariesGroupsGender: null,
        beneficiariesGroupsAge: null,
        beneficiariesGroupsDisabledPeople: null,
        beneficiariesGroupsReligion: null,
        beneficiariesGroupsReligionOther: null,
    });

    const result = formBuilder({ data }).validation;

    expect(mapMessages(result)).toMatchSnapshot();
});

test('strip beneficiary data when check is "no"', () => {
    const form = formBuilder({
        data: mockBeneficiaries('no'),
    });

    expect(form.validation.value).toEqual({
        beneficiariesGroupsCheck: 'no',
    });
});

test('allow only "other" option for beneficiary groups', () => {
    const data = mockResponse({
        beneficiariesGroupsCheck: 'yes',
        beneficiariesGroups: undefined,
        beneficiariesGroupsOther: 'this should be valid',
    });

    const form = formBuilder({ data });
    expect(form.validation.error).toBeUndefined();
});

test('finance details required if organisation is over 15 months old', function () {
    const now = moment();
    const requiredDate = now.clone().subtract('15', 'months');

    const validData = mockResponse({
        organisationStartDate: { month: now.month() + 1, year: now.year() },
        accountingYearDate: null,
        totalIncomeYear: null,
    });

    const validForm = formBuilder({ data: validData });
    expect(validForm.validation.error).toBeUndefined();

    const invalidData = mockResponse({
        organisationStartDate: {
            month: requiredDate.month() + 1,
            year: requiredDate.year(),
        },
        accountingYearDate: null,
        totalIncomeYear: null,
    });

    const invalidForm = formBuilder({ data: invalidData });

    expect(mapMessages(invalidForm.validation)).toMatchSnapshot();
});

test.each(['school', 'college-or-university', 'statutory-body'])(
    'dates of birth and addresses stripped for %p',
    function (excludedOrgType) {
        const validData = {
            organisationType: excludedOrgType,
            seniorContactDateOfBirth: mockDateOfBirth(18, 90),
            mainContactDateOfBirth: mockDateOfBirth(16, 90),
            seniorContactAddress: mockAddress(),
            seniorContactAddressHistory: {
                currentAddressMeetsMinimum: 'yes',
                previousAddress: mockAddress(),
            },
            mainContactAddress: mockAddress(),
            mainContactAddressHistory: {
                currentAddressMeetsMinimum: 'yes',
                previousAddress: mockAddress(),
            },
        };

        const invalidData = {
            organisationType: excludedOrgType,
            seniorContactDateOfBirth: mockDateOfBirth(1, 17),
            mainContactDateOfBirth: mockDateOfBirth(1, 17),
            seniorContactAddress: {
                line1: faker.address.streetAddress(),
                townCity: faker.address.city(),
                county: faker.address.county(),
            },
            mainContactAddress: {
                line1: faker.address.streetAddress(),
                townCity: faker.address.city(),
                county: faker.address.county(),
            },
        };

        const expected = { organisationType: excludedOrgType };

        const validForm = formBuilder({ data: validData });
        expect(validForm.validation.value).toEqual(expected);

        // Should strip even when values are invalid
        const invalidForm = formBuilder({ data: invalidData });
        expect(invalidForm.validation.value).toEqual(expected);

        const seniorContactFields = fieldsForStep(
            validForm,
            'senior-contact',
            0
        );

        expect(seniorContactFields).not.toContainEqual([
            'seniorContactDateOfBirth',
            'seniorContactAddress',
            'seniorContactAddressHistory',
        ]);

        const mainContactFields = fieldsForStep(validForm, 'main-contact', 0);

        expect(mainContactFields).not.toContainEqual([
            'mainContactDateOfBirth',
            'mainContactAddress',
            'mainContactAddressHistory',
        ]);
    }
);

test('contact email addresses must not match', function () {
    const emails = {
        lowercase: 'example@example.com',
        uppercase: 'Example@example.com',
    };
    // Test each combination of cases to ensure the order of completion has no effect
    const forms = [
        formBuilder({
            data: mockResponse({
                mainContactEmail: emails.lowercase,
                seniorContactEmail: emails.uppercase,
            }),
        }),
        formBuilder({
            data: mockResponse({
                mainContactEmail: emails.uppercase,
                seniorContactEmail: emails.lowercase,
            }),
        }),
    ];

    forms.forEach((form) => {
        expect(mapMessages(form.validation)).toEqual(
            expect.arrayContaining([
                expect.stringContaining(
                    'Main contact email address must be different'
                ),
            ])
        );
    });
});
