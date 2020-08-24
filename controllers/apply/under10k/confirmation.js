'use strict';
const get = require('lodash/fp/get');
const { stripIndents } = require('common-tags');

const { getContactFullName } = require('./lib/contacts');

function getEmailFor(country) {
    const countryEmail = {
        'default': 'general.enquiries@tnlcommunityfund.org.uk',
        'england': 'afe@tnlcommunityfund.org.uk',
        'scotland': 'advicescotland@tnlcommunityfund.org.uk',
        'northern-ireland': 'enquiries.ni@tnlcommunityfund.org.uk',
        'wales': 'wales@tnlcommunityfund.org.uk',
    }[country];

    return countryEmail || 'general.enquiries@tnlcommunityfund.org.uk';
}

function getPhoneFor(country) {
    const countryPhone = {
        'scotland': '0141 846 0447',
        'northern-ireland': '028 4378 0003',
        'wales': '029 2168 0214',
    }[country];

    return countryPhone || '028 9568 0143';
}

module.exports = function ({ locale, data = {} }) {
    const localise = get(locale);
    const country = get('projectCountry')(data);

    const [mainContact, seniorContact] = ['main', 'senior'].map(
        (contactType) => {
            return {
                fullName: getContactFullName(
                    get(`${contactType}ContactName`)(data)
                ),
                email: get(`${contactType}ContactEmail`)(data),
            };
        }
    );

    function enConfirmationBody() {
        function leadTimeText() {
            if (country === 'england') {
                return `<p>
                    We’ll look at your idea and do some checks.
                    Given the huge demand for funding,
                    we’re focusing on funding projects and organisations
                    helping communities through the COVID-19 pandemic,
                    so they can start as soon as possible
                </p>`;
            } else {
                return `<p>
                    We’ll look at your idea and do some checks.
                    We’re now prioritising decisions for COVID-19 related
                    projects, so they can start sooner. And it might take us longer
                    to assess applications that aren’t about COVID-19.
                </p>`;
            }
        }

        return stripIndents`
            <h2>We’ve just sent an email to your main and senior contact</h2>
            <p>
                This is just a confirmation email, with a summary of your answers
                (in case you want to look back at them at any point).
            </p>
            <h2>
                Now we’ve got your application – 
                we'll start assessing it as soon as we can
            </h2>
            ${leadTimeText()}
            <h2>While we’re assessing your application – we might get in touch</h2>
            <p>
                We don’t always do this. It’s only if we need a bit more information.
                So don’t worry if you don’t hear from us.
            </p>
            <h2>
                We’ll let
                <span data-hj-suppress>${mainContact.fullName} and
                ${seniorContact.fullName}</span> know our decision by email
            </h2>
            <p>
                We’ll email
                <strong data-hj-suppress>${mainContact.email}</strong> and 
                <strong data-hj-suppress>${seniorContact.email}</strong>.
                Make sure to check the junk mail too (just in case).
            </p>
            <h2>If you have any questions, you can contact us in the meantime</h2>
            <p>
                Please call ${getPhoneFor(country)} or email
                <a href="mailto:${getEmailFor(country)}">
                    ${getEmailFor(country)}
                </a>
                and we will be happy to help you.
            </p>
            <p>
                Good luck with your application!<br />
                <strong>The National Lottery Community Fund</strong>
            </p>`;
    }

    function cyConfirmationBody() {
        function leadTimeText() {
            if (country === 'england') {
                return `<p>Byddwn yn edrych ar eich syniad ac yn gwneud rhai gwiriadau.
                O ystyried yr'r galw enfawr am arian grant, rydym nawr yn
                canolbwyntio ar ariannu prosiectau a sefydliadau sy'n helpu cymunedau
                trwy'r pandemig COVID-19, fel y gallant ddechrau cyn gynted â phosibl
                </p>`;
            } else {
                return `<p>Byddwn yn edrych ar eich syniad ac yn gwneud rhai gwiriadau. 
                Rydym nawr yn blaenoriaethu penderfyniadau ar gyfer prosiectau 
                cysylltiedig â COVID-19, fel y gallant gychwyn yn gynt. Ac fe allai gymryd 
                mwy o amser i ni asesu ceisiadau nad ydyn nhw'n ymwneud â COVID-19.</p>`;
            }
        }

        return stripIndents`
            <h2>Rydym newydd anfon e-bost i’ch prif ac uwch gyswllt </h2>
            <p>Dim ond e-bost cadarnhad yw hwn, gyda chrynodeb o’ch atebion 
            (rhag ofn eich bod eisiau edrych yn ôl arnyn nhw ar unrhyw bwynt).</p>

            <h2>Nawr bod gennym eich cais, byddwn yn dechrau ei asesu cyn gynted ag y gallwn</h2>
            ${leadTimeText()}
        
            <h2>Tra rydym yn asesu eich cais – efallai byddwn mewn cysylltiad</h2>
            <p>Nid ydym yn gwneud hyn o hyd. Dim ond os ydym angen ychydig mwy o
             wybodaeth. Felly peidiwch â phoeni os nad ydych yn clywed gennym.</p>
            
            <h2>Byddwn yn rhoi gwybod o’n penderfyniad i <span data-hj-suppress>${
                mainContact.fullName
            } a ${seniorContact.fullName}</span> dros e-bost</h2>
            <p>Byddwn yn e-bostio <strong data-hj-suppress>${
                mainContact.email
            }</strong> a <strong data-hj-suppress>${
            seniorContact.email
        }</strong>. Sicrhewch eich bod yn gwirio eich post sothach hefyd (rhag ofn).</p>
            
            <h2>Os oes gennych unrhyw gwestiynau, gallwch gysylltu â ni yn y cyfamser</h2>
            <p>Ffoniwch ${getPhoneFor(
                country
            )} neu e-bostio <a href="mailto:${getEmailFor(
            country
        )}">${getEmailFor(country)}</a> a byddwn yn hapus i’ch helpu.</p>
            
            <p>
                Pob lwc gyda’ch cais!<br />
                <strong>Cronfa Gymunedol y Loteri Genedlaethol</strong>
            </p>`;
    }

    return {
        title: localise({
            en: `Thanks - we’ve got your application now`,
            cy: `Diolch – mae gennym eich cais nawr`,
        }),
        body: localise({
            en: enConfirmationBody(),
            cy: cyConfirmationBody(),
        }),
    };
};
