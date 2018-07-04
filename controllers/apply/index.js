'use strict';
const { get, isEmpty, set, unset } = require('lodash');
const { matchedData } = require('express-validator/filter');
const { validationResult } = require('express-validator/check');
const express = require('express');
const Raven = require('raven');
const path = require('path');

const appData = require('../../modules/appData');
const cached = require('../../middleware/cached');
const buildingConnectionsForm = require('./building-connections/form-model');
const reachingCommunitiesForm = require('./reaching-communities/form-model');

function createFormRouter(formModel) {
    const router = express.Router();

    router.use((req, res, next) => {
        res.locals.isBilingual = false;
        next();
    });

    const formSteps = formModel.getSteps();
    const totalSteps = formSteps.length + 1; // allow for the review 'step"

    function getFormSession(req, step) {
        return get(req.session, formModel.getSessionProp(step), {});
    }

    function getStepProgress({ baseUrl, currentStepNumber }) {
        return {
            prevStepUrl: currentStepNumber > 1 ? `${baseUrl}/${currentStepNumber - 1}` : baseUrl,
            currentStepNumber: currentStepNumber,
            totalSteps: totalSteps
        };
    }

    /**
     * Route: Start page
     */
    router.get('/', function(req, res) {
        const stepConfig = formModel.getStartPage();
        res.render(stepConfig.template, {
            title: formModel.title,
            startUrl: `${req.baseUrl}/1`,
            stepConfig: stepConfig,
            form: formModel
        });
    });

    /**
     * Route: Form steps
     */
    formSteps.forEach((step, idx) => {
        const currentStepNumber = idx + 1;

        function renderStep(req, res, errors = []) {
            const stepData = getFormSession(req, currentStepNumber);
            res.render(path.resolve(__dirname, './form'), {
                csrfToken: req.csrfToken(),
                form: formModel,
                step: step.withValues(stepData),
                stepProgress: getStepProgress({ baseUrl: req.baseUrl, currentStepNumber }),
                errors: errors
            });
        }

        function renderStepIfAllowed(req, res) {
            if (currentStepNumber > 1 && isEmpty(getFormSession(req, currentStepNumber - 1))) {
                res.redirect(req.baseUrl);
            } else {
                renderStep(req, res);
            }
        }

        function handleSubmitStep({ isEditing = false } = {}) {
            return [
                step.getValidators(),
                function(req, res) {
                    // Save valid fields and merge with any existing data (if we are editing the step);
                    const sessionProp = formModel.getSessionProp(currentStepNumber);
                    const stepData = get(req.session, sessionProp, {});
                    const bodyData = matchedData(req, { locations: ['body'] });
                    set(req.session, sessionProp, Object.assign(stepData, bodyData));

                    req.session.save(() => {
                        const errors = validationResult(req);
                        if (errors.isEmpty()) {
                            if (isEditing === true || currentStepNumber === formSteps.length) {
                                res.redirect(`${req.baseUrl}/review`);
                            } else {
                                res.redirect(`${req.baseUrl}/${currentStepNumber + 1}`);
                            }
                        } else {
                            renderStep(req, res, errors.array());
                        }
                    });
                }
            ];
        }

        /**
         * Step router
         */
        router
            .route(`/${currentStepNumber}`)
            .all(cached.csrfProtection)
            .get(renderStepIfAllowed)
            .post(handleSubmitStep());

        /**
         * Step edit router
         *
         */
        router
            .route(`/${currentStepNumber}/edit`)
            .all(cached.csrfProtection)
            .get(function(req, res) {
                const formSession = getFormSession(req);
                const completedSteps = Object.keys(formSession).filter(key => /^step-/.test(key)).length;
                if (completedSteps < totalSteps - 1) {
                    res.redirect(req.originalUrl.replace('/edit', ''));
                } else {
                    renderStepIfAllowed(req, res);
                }
            })
            .post(handleSubmitStep({ isEditing: true }));
    });

    /**
     * Route: Review
     */
    router
        .route('/review')
        .all(cached.csrfProtection)
        .get(function(req, res) {
            const formData = getFormSession(req);
            if (isEmpty(formData)) {
                res.redirect(req.baseUrl);
            } else {
                res.render(path.resolve(__dirname, './review'), {
                    csrfToken: req.csrfToken(),
                    form: formModel,
                    stepConfig: formModel.getReviewStep(),
                    stepProgress: getStepProgress({ baseUrl: req.baseUrl, currentStepNumber: totalSteps }),
                    summary: formModel.getStepsWithValues(formData),
                    baseUrl: req.baseUrl
                });
            }
        })
        .post(async function(req, res) {
            const formData = getFormSession(req);
            const successStep = formModel.getSuccessStep();
            const errorStep = formModel.getErrorStep();

            if (isEmpty(formData)) {
                res.redirect(req.baseUrl);
            } else {
                try {
                    await successStep.processor(formModel, formData);
                    res.redirect(`${req.baseUrl}/success`);
                } catch (error) {
                    Raven.captureException(error);
                    res.render(path.resolve(__dirname, './error'), {
                        form: formModel,
                        stepConfig: errorStep,
                        returnUrl: `${req.baseUrl}/review`
                    });
                }
            }
        });

    /**
     * Route: Success
     */
    router.get('/success', cached.noCache, function(req, res) {
        const formData = getFormSession(req);
        const successStep = formModel.getSuccessStep();

        if (isEmpty(formData)) {
            res.redirect(req.baseUrl);
        } else {
            // Clear the submission from the session on success
            unset(req.session, formModel.getSessionProp());
            req.session.save(() => {
                res.render(successStep.template, {
                    form: formModel,
                    stepConfig: successStep
                });
            });
        }
    });

    return router;
}

module.exports = ({ router }) => {
    router.get('/', (req, res) => {
        res.redirect('/');
    });

    router.use('/your-idea', createFormRouter(reachingCommunitiesForm));

    if (appData.isNotProduction) {
        router.use('/building-connections', createFormRouter(buildingConnectionsForm));
    }

    return router;
};
