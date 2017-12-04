'use strict';
module.exports = [
    {
        name: 'yourName',
        type: 'text',
        required: true,
        label: {
            en: 'Name',
            cy: 'Eich enw'
        }
    },
    {
        name: 'yourEmail',
        type: 'email',
        required: true,
        label: {
            en: 'Email address',
            cy: 'Eich cyfeiriad e-bost'
        }
    },
    {
        name: 'yourAddress1',
        type: 'text',
        required: true,
        label: {
            en: 'Address line 1',
            cy: 'Eich cyfeiriad llinell 1'
        }
    },
    {
        name: 'yourAddress2',
        type: 'text',
        required: false,
        label: {
            en: 'Address line 2',
            cy: 'Eich cyfeiriad llinell 2'
        }
    },
    {
        name: 'yourTown',
        type: 'text',
        required: true,
        label: {
            en: 'Town/city',
            cy: 'Eich tref/dinas'
        }
    },
    {
        name: 'yourCounty',
        type: 'text',
        required: false,
        label: {
            en: 'County',
            cy: 'Eich sir'
        }
    },
    {
        name: 'yourPostcode',
        type: 'text',
        required: true,
        label: {
            en: 'Postcode',
            cy: 'Eich côd post'
        }
    },
    {
        name: 'yourProjectName',
        type: 'text',
        required: false,
        label: {
            en: 'Project name',
            cy: 'Enw eich prosiect'
        }
    },
    {
        name: 'yourGrantAmount',
        type: 'select',
        required: true,
        label: {
            en: 'Grant amount',
            cy: 'Swm eich grant'
        },
        options: [
            {
                name: 'Under £10,000',
                value: 'under10k'
            },
            {
                name: 'Over £10,000',
                value: 'over10k'
            },
            {
                name: "Don't know",
                value: 'dunno'
            }
        ]
    }
];
