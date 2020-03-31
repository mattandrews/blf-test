'use strict';
const get = require('lodash/fp/get');

const TextareaField = require('../../lib/field-types/textarea');

module.exports = function (locale) {
    const localise = get(locale);

    const minWords = 50;
    const maxWords = 150;

    return new TextareaField({
        locale: locale,
        name: 'yourIdeaPriorities',
        label: localise({
            en: `How does your project meet at least one of our funding priorities?`,
            cy: `Sut mae eich prosiect yn bodloni o leiaf un o’n tair blaenoriaeth ariannu?`,
        }),
        explanation: localise({
            en: `<p>
                <strong>We want to fund projects that do at least one of these three things:</strong>
            </p>
            <ol>
                <li>Bring people together and build strong
                    relationships in and across communities</li>
                <li>Improve the places and spaces that matter to communities</li>
                <li>Help more people to reach their potential,
                    by supporting them at the earliest possible stage</li>
            </ol>
            <p>You can tell us if your project meets more than one priority,
               but don't worry if it doesn't.</p>
            <p><strong>
                You can write up to ${maxWords} words for this section,
                but don't worry if you use less.
            </strong></p>`,

            cy: `<p>
                <strong>Rydym am ariannu prosiectau sy'n gwneud o leiaf un o'r tri pheth hyn:</strong>
            </p>
            <ol>
                <li>Dod â phobl ynghyd a chreu perthnasau cryf o fewn ac ar draws cymunedau</li>
                <li>Gwella’r ardaloedd a gofodau sy’n bwysig i gymunedau</li>
                <li>Helpu mwy o bobl i gyflawni eu potensial drwy eu cefnogi ar y cam cyntaf posib.</li>
            </ol>
            <p>Gallwch ddweud wrthym os yw eich prosiect yn cwrdd â mwy nag un
               flaenoriaeth, ond peidiwch â phoeni os na fydd.</p>
            <p><strong>
                Gallwch ysgrifennu hyd at ${maxWords} gair i’r adran hon, ond
                peidiwch â phoeni os byddwch yn defnyddio llai. 
            </strong></p>`,
        }),
        minWords: minWords,
        maxWords: maxWords,
        attributes: { rows: 12 },
        messages: [
            {
                type: 'base',
                message: localise({
                    en: `Tell us how your project meets at least one of our funding priorities`,
                    cy: `Dywedwch wrthym sut mae eich prosiect yn cwrdd ag o leiaf un o’n blaenoriaethau ariannu`,
                }),
            },
        ],
    });
};