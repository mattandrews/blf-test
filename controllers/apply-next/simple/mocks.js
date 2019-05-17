'use strict';
const { values } = require('lodash');
const moment = require('moment');
const faker = require('faker');

const { BENEFICIARY_GROUPS } = require('./constants');
const { toDateParts } = require('../../../modules/dates');

function mockStartDate(weeks) {
    return toDateParts(moment().add(weeks, 'weeks'));
}

function mockDateOfBirth(minAge, maxAge = 75) {
    const dt = moment().subtract(
        faker.random.number({ min: minAge, max: maxAge }),
        'years'
    );
    return toDateParts(dt);
}

function mockAddress() {
    return {
        'building-street': faker.address.streetAddress(),
        'town-city': faker.address.city(),
        'county': faker.address.county(),
        'postcode': 'B15 1TR'
    };
}

function mockBudget() {
    return new Array(5).fill(null).map(() => {
        return {
            item: faker.lorem.words(5),
            cost: faker.random.number({ min: 100, max: 1000 })
        };
    });
}

function mockFullForm({
    country,
    organisationType,
    companyNumber = null,
    charityNumber = null,
    educationNumber = null
}) {
    return {
        'project-name': faker.lorem.words(5),
        'project-country': country,
        'project-start-date': mockStartDate(12),
        'project-location': 'West Midlands',
        'project-location-description': faker.lorem.sentence(),
        'project-postcode': 'B15 1TR',
        'your-idea-project': faker.lorem.words(250),
        'your-idea-priorities': faker.lorem.words(100),
        'your-idea-community': faker.lorem.words(150),
        'project-budget': mockBudget(),
        'project-total-costs': 20000,
        'beneficiaries-groups-check': 'yes',
        'beneficiaries-groups': values(BENEFICIARY_GROUPS),
        'beneficiaries-groups-other': undefined,
        'beneficiaries-ethnic-background': ['african', 'caribbean'],
        'beneficiaries-groups-gender': ['non-binary'],
        'beneficiaries-groups-age': ['0-12', '13-24'],
        'beneficiaries-groups-disabled-people': ['sensory'],
        'beneficiaries-groups-religion': ['sikh'],
        'beneficiaries-groups-religion-other': undefined,
        'organisation-legal-name': faker.company.companyName(),
        'organisation-trading-name': faker.company.companyName(),
        'organisation-address': mockAddress(),
        'organisation-type': organisationType,
        'company-number': companyNumber,
        'charity-number': charityNumber,
        'education-number': educationNumber,
        'accounting-year-date': { day: 1, month: 3 },
        'total-income-year': faker.random.number({ min: 10000, max: 1000000 }),
        'main-contact-first-name': faker.name.firstName(),
        'main-contact-last-name': faker.name.lastName(),
        'main-contact-dob': mockDateOfBirth(16),
        'main-contact-address': mockAddress(),
        'main-contact-address-history': {
            'current-address-meets-minimum': 'no',
            'previous-address': mockAddress()
        },
        'main-contact-email': faker.internet.exampleEmail(),
        'main-contact-phone': '0345 4 10 20 30',
        'main-contact-communication-needs': [],
        'senior-contact-first-name': faker.name.firstName(),
        'senior-contact-last-name': faker.name.lastName(),
        'senior-contact-role': 'trustee',
        'senior-contact-dob': mockDateOfBirth(18),
        'senior-contact-address': mockAddress(),
        'senior-contact-address-history': {
            'current-address-meets-minimum': 'yes',
            'previous-address': null
        },
        'senior-contact-email': faker.internet.exampleEmail(),
        'senior-contact-phone': '020 7211 1888',
        'senior-contact-communication-needs': [],
        'bank-account-name': faker.company.companyName(),
        'bank-sort-code': '108800',
        'bank-account-number': '00012345',
        'bank-building-society-number': undefined,
        'bank-statement': 'example.pdf'
    };
}

module.exports = {
    mockAddress,
    mockBudget,
    mockDateOfBirth,
    mockFullForm,
    mockStartDate
};
