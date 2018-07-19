'use strict';
const { check } = require('express-validator/check');
const { createFormModel } = require('../../helpers/create-form-model');
const processor = require('./processor');

const PROJECT_LOCATIONS = [
    {
        "label": "East Midlands",
        "value": "East Midlands"
    },
    {
        "label": "East of England",
        "value": "East of England"
    },
    {
        "label": "London",
        "value": "London"
    },
    {
        "label": "North East",
        "value": "North East"
    },
    {
        "label": "North West",
        "value": "North West"
    },
    {
        "label": "Northern Ireland",
        "value": "Northern Ireland"
    },
    {
        "label": "Scotland",
        "value": "Scotland"
    },
    {
        "label": "South East",
        "value": "South East"
    },
    {
        "label": "South West",
        "value": "South West"
    },
    {
        "label": "Wales",
        "value": "Wales"
    },
    {
        "label": "West Midlands",
        "value": "West Midlands"
    },
    {
        "label": "Yorkshire and the Humber",
        "value": "Yorkshire and the Humber"
    }
];

const formModel = createFormModel({
    id: 'digital-funding-demo',
    title: 'Digital Funding (Demo)',
    shortCode: 'DF-ALPHA'
});

formModel.registerStartPage({
    template: 'pages/apply/digital-funding-demo/startpage'
});

formModel.registerStep({
    name: 'Your idea',
    fieldsets: [
        {
            legend: 'Find out how we can help you',
            introduction: `
                <p>
                    If you have already read our guidance about telling us your idea for 
                    <a href="/funding/programmes/digital-funding-demo#section-3">Digital Funding</a>, you can use the box 
                    below to share it with us, and details about your organisation. Remember, you don’t have to have 
                    all the details, but try to include:
                </p>
                <ul>
                    <li>what you want to do and why</li>
                    <li>what difference you think your idea will make</li>
                    <li>how people and communities are involved with your project</li>
                    <li>the background to your organisation</li>
                    <li>the length of your project budget and how much funding you’ll need from us</li>
                    <li>how your idea fits in with other activities</li>                
                </ul>
                <p>
                    This information will go to one of our funding officers who will get in touch within fifteen working 
                    days to find out more. If it is something we could fund, this is just the start of the conversation.
                </p>
            `,
            fields: [
                {
                    name: 'your-idea',
                    type: 'textarea',
                    isRequired: true,
                    rows: 12,
                    label: 'Briefly explain your idea and why it’ll make a difference',
                    helpText: `<p>We support ideas that meet our three funding priorities. Show us how you plan to:</p>
                    <ul>
                        <li>bring people together and build strong relationships in and across communities
                        <li>improve the places and spaces that matter to communities</li>
                        <li>enable more people to fulfil their potential by working to address issues at the earliest possible stage.</li>
                    </ul>`,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Please tell us your idea');
                    }
                }
            ]
        }
    ]
});

formModel.registerStep({
    name: 'Project location',
    internalOrder: 3,
    fieldsets: [
        {
            legend: 'Where will your project take place?',
            fields: [
                {
                    label: 'Select all regions that apply',
                    type: 'checkbox',
                    options: PROJECT_LOCATIONS,
                    isRequired: true,
                    name: 'location',
                    validator: function(field) {
                        return check(field.name)
                            .not()
                            .isEmpty()
                            .withMessage('Project region must be provided');
                    }
                },
                {
                    type: 'text',
                    name: 'project-location',
                    label: 'Project location',
                    explanation:
                        'In your own words, describe the locations that you’ll be running your project in. eg. “Newcastle community centre” or “Alfreton, Derby and Ripley”.',
                    isRequired: true,
                    size: 60,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Project location must be provided');
                    }
                }
            ]
        }
    ]
});

formModel.registerStep({
    name: 'Your organisation',
    internalOrder: 2,
    fieldsets: [
        {
            legend: 'Your organisation',
            fields: [
                {
                    type: 'text',
                    name: 'organisation-name',
                    label: 'Legal name',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Organisation must be provided');
                    }
                },
                {
                    type: 'text',
                    name: 'additional-organisations',
                    label: 'Add another organisation',
                    explanation:
                        'If you’re working with other organisations to deliver your idea, list them below. If you don’t know yet we can discuss this later on.',
                    isRequired: false,
                    size: 60,
                    validator: function(field) {
                        return check(field.name).trim();
                    }
                }
            ]
        }
    ]
});

formModel.registerStep({
    name: 'Your details',
    internalOrder: 1,
    fieldsets: [
        {
            legend: 'Your details',
            fields: [
                {
                    type: 'text',
                    name: 'first-name',
                    autocompleteName: 'given-name',
                    label: 'First name',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('First name must be provided');
                    }
                },
                {
                    type: 'text',
                    name: 'last-name',
                    autocompleteName: 'family-name',
                    label: 'Last name',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Last name must be provided');
                    }
                },
                {
                    type: 'email',
                    name: 'email',
                    autocompleteName: 'email',
                    label: 'Email address',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Please provide your email address')
                            .isEmail()
                            .withMessage('Please provide a valid email address');
                    }
                },
                {
                    type: 'text',
                    name: 'phone-number',
                    autocompleteName: 'tel',
                    label: 'Phone number',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Please provide a contact telephone number');
                    }
                }
            ]
        }
    ]
});

formModel.registerReviewStep({
    title: 'Check this is right before submitting your idea',
    proceedLabel: 'Submit'
});

formModel.registerSuccessStep({
    template: 'pages/apply/digital-funding-demo/success',
    processor: processor
});

formModel.registerErrorStep({
    title: 'There was an problem submitting your idea',
    message: `
<p>There was a problem submitting your idea, we have been notified of the problem.</p>
<p>Please return to the review step and try again. If you still see an error please call <a href="tel:03454102030">0345 4 10 20 30</a> (Monday–Friday 9am–5pm).</p>
`
});

module.exports = formModel;
