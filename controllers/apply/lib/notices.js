'use strict';
const config = require('config');
const moment = require('moment');
const { oneLine } = require('common-tags');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');

const enableGovCOVIDUpdates = config.get(
    'fundingUnder10k.enableGovCOVIDUpdates'
);

const enableStandardEnglandAutoProjectDuration = config.get(
    'standardFundingProposal.enableEnglandAutoProjectDuration'
);

module.exports = {
    getNoticesAll(locale, pendingApplications = []) {
        const localise = get(locale);

        function showEnglandPrioritiesNotice() {
            // Only show notice for applications created before this date
            // @TODO this can be removed after 2020-08-12 as any applications
            // which were created before this will have expired
            const cutoffDate = '2020-05-12';
            return pendingApplications.some(function (application) {
                return (
                    application.formId === 'awards-for-all' &&
                    get('applicationData.projectCountry')(application) ===
                        'england' &&
                    moment(application.createdAt).isBefore(cutoffDate)
                );
            });
        }


        const notices = [];


        if (showEnglandPrioritiesNotice()) {
            notices.push({
                title: localise({
                    en: oneLine`For funding under £10,000 in England, we're now only
                    accepting COVID-19 related applications`,
                    cy: oneLine`Ar gyfer ariannu o dan £10,000 yn Lloegr, dim ond
                    ceisiadau cysylltiedig â COVID-19 yr ydym yn eu derbyn`,
                }),
                body: localise({
                    en: oneLine`If you've started an application already,
                    and it's not related to supporting your community
                    or organisation through the pandemic, we won't be
                    able to fund it. But you could decide to start
                    a new one that focuses on COVID-19 instead.`,
                    cy: oneLine`Os ydych chi wedi cychwyn cais yn barod,
                    ac nad yw'n gysylltiedig â chefnogi'ch cymuned
                    neu sefydliad trwy'r pandemig, ni fyddwn yn gallu
                    ei dderbyn. Ond fe allech chi benderfynu cychwyn
                    un newydd sy'n canolbwyntio ar COVID-19 yn lle.`,
                }),
            });

            if (enableGovCOVIDUpdates) {
                notices.push({
                    title: oneLine`We've also changed our eligibility
                        criteria to help communities through the pandemic`,
                    body: oneLine`So in England we're only funding voluntary
                        and community organisations for the time being.`,
                });
            }
        }

        return notices;
    },
    getNoticesSingle(locale, application = []) {
        const isEnglandStatutory =
            application.formId === 'awards-for-all' &&
            get('applicationData.projectCountry')(application) === 'england' &&
            ['school', 'college-or-university', 'statutory-body'].includes(
                get('applicationData.organisationType')(application)
            ) === true;

        /*
         * Only show notice for applications created before this date
         * when the projectDurationYears field was removed for England apps
         * @TODO this can be removed after 2020-09-04 as any applications
         * which were created before this will have expired
         */
        const projectDurationCutoffDate = '2020-06-04';
        const isEnglandStandard =
            application.formId === 'standard-enquiry' &&
            getOr(
                [],
                'applicationData.projectCountries'
            )(application).includes('england') &&
            moment(application.createdAt).isBefore(projectDurationCutoffDate);

        const notices = [];

        if (enableGovCOVIDUpdates && isEnglandStatutory) {
            notices.push({
                title: `We're sorry, but your application is now not eligible for funding`,
                body: oneLine`We've changed our eligibility criteria
                    (for the time being) to help communities through
                    the pandemic. So for funding under £10,000,
                    we're only funding voluntary and community
                    organisations with COVID-19 related projects.`,
            });
        }

        if (enableStandardEnglandAutoProjectDuration && isEnglandStandard) {
            notices.push(
                {
                    title: oneLine`For funding over £10,000 in England, we're 
                        now only accepting COVID-19 related applications`,
                    body: oneLine`If you've started an application already, and 
                        it's not related to supporting your community or 
                        organisation through the pandemic, we won't be able to 
                        fund it. But you could decide to start a new one that 
                        focuses on COVID-19 instead.`,
                },
                {
                    title: oneLine`We've also changed our eligibility criteria 
                        to help communities through the pandemic`,
                    body: oneLine`So in England we're only funding voluntary and 
                        community organisations for the time being. And we can 
                        generally only award a maximum of £100,000 for up to 
                        six months.`,
                }
            );
        }

        return notices;
    },
};
