'use strict';
const cloneDeep = require('lodash/cloneDeep');
const find = require('lodash/find');
const findIndex = require('lodash/findIndex');
const findLastIndex = require('lodash/findLastIndex');
const get = require('lodash/fp/get');
const isEmpty = require('lodash/isEmpty');
const pick = require('lodash/pick');
const reduce = require('lodash/reduce');

const Joi = require('@hapi/joiNext');

const normaliseErrors = require('./normalise-errors');

class FormModel {
    constructor(props, data = {}, locale = 'en') {
        const localise = get(locale);

        this.title = props.title;
        this.startLabel = props.startLabel;
        this.allFields = props.allFields;
        this.formData = data;

        this.featuredErrorsAllowList = props.featuredErrorsAllowList || [];

        const validation = this.validate(data);
        this.validation = validation;

        function enrichField(field) {
            field.withValue(find(data, (value, name) => name === field.name));

            field.withErrors(
                validation.messages.filter(
                    (messages) => messages.param === field.name
                )
            );

            field.withFeaturedErrors(
                validation.featuredMessages.filter(
                    (messages) => messages.param === field.name
                )
            );

            return field;
        }

        this.sections = props.sections.map((originalSection) => {
            const section = cloneDeep(originalSection);

            section.steps = section.steps.map(function (step, stepIndex) {
                step.fieldsets = step.fieldsets.map((fieldset) => {
                    fieldset.fields = fieldset.fields.map(enrichField);
                    return fieldset;
                });

                step.slug = `${section.slug}/${stepIndex + 1}`;

                return step;
            });

            const sectionFieldNames = section.steps
                .flatMap((step) => step.getCurrentFields())
                .map((field) => field.name);

            function sectionStatus() {
                const fieldData = pick(data, sectionFieldNames);
                const fieldErrors = validation.messages.filter((item) =>
                    sectionFieldNames.includes(item.param)
                );

                if (isEmpty(fieldData)) {
                    return 'empty';
                } else if (fieldErrors.length > 0) {
                    return 'incomplete';
                } else {
                    return 'complete';
                }
            }

            function sectionStatusLabel() {
                const status = sectionStatus(validation);
                if (status === 'complete') {
                    return localise({ en: 'Complete', cy: 'Cyflawn' });
                } else if (status === 'incomplete') {
                    return localise({ en: 'In progress', cy: 'Ar ei ganol' });
                } else {
                    return localise({ en: 'Not started', cy: 'Heb ddechrau' });
                }
            }

            section.progress = {
                slug: section.slug,
                label: section.shortTitle || section.title,
                status: sectionStatus(),
                statusLabel: sectionStatusLabel(),
            };

            section.hasFeaturedErrors = validation.featuredMessages.some(
                (item) => sectionFieldNames.includes(item.param)
            );

            return section;
        });

        /**
         * Form progress
         */
        const formIsEmpty = isEmpty(this.validation.value);
        this.progress = {
            isComplete:
                formIsEmpty === false && this.validation.error === undefined,
            isPristine: formIsEmpty === true,
            sectionsComplete: this.sections.filter(
                (section) => section.progress.status === 'complete'
            ).length,
            sections: this.sections.map((section) => section.progress),
        };

        this.summary = props.summary;
        this.schemaVersion = props.schemaVersion;
        this.forSalesforce = props.forSalesforce;
    }

    get schema() {
        return Joi.object(
            reduce(
                this.allFields,
                function (acc, field) {
                    acc[field.name] = field.schema;
                    return acc;
                },
                {}
            )
        );
    }

    get messages() {
        return reduce(
            this.allFields,
            function (acc, field) {
                acc[field.name] = field.messages;
                return acc;
            },
            {}
        );
    }

    /**
     * Determine featured messages.
     *
     * Based on allow list on the form model.
     * e.g. [{ fieldName: 'example', includeBaseMessage: true }]
     *
     * Accepts `includeBase` to determine if `base`
     * message types should be included in the list.
     */
    _getFeaturedMessages(messages) {
        return messages.filter((message) => {
            return this.featuredErrorsAllowList.some((item) => {
                if (item.includeBase === true) {
                    return item.fieldName === message.param;
                } else {
                    return (
                        item.fieldName === message.param &&
                        message.type !== 'base'
                    );
                }
            });
        });
    }

    validate(data) {
        const { value, error } = this.schema.validate(data, {
            abortEarly: false,
            stripUnknown: true,
        });

        const messages = normaliseErrors({
            validationError: error,
            errorMessages: this.messages,
            formFields: this.allFields,
        });

        return {
            value: value,
            error: error,
            isValid: error === undefined && messages.length === 0,
            messages: messages,
            featuredMessages: this._getFeaturedMessages(messages),
        };
    }

    getSection(slug) {
        return this.sections.find((section) => section.slug === slug);
    }

    getCurrentSteps() {
        return this.sections.flatMap((section) => section.steps);
    }

    getCurrentFields() {
        return this.getCurrentSteps()
            .flatMap((step) => step.fieldsets)
            .flatMap((fieldset) => fieldset.fields);
    }

    getStep(sectionSlug, stepIndex) {
        const section = this.getSection(sectionSlug);
        return section.steps[stepIndex];
    }

    getErrorsByStep() {
        const { messages } = this.validation;
        if (messages.length > 0) {
            return this.getCurrentSteps().map((step) => {
                return {
                    title: step.title,
                    errors: step.filterErrors(messages),
                };
            });
        } else {
            return [];
        }
    }

    previousSection(sectionSlug) {
        const currentSectionIndex = findIndex(
            this.sections,
            (section) => section.slug === sectionSlug
        );

        return this.sections[currentSectionIndex - 1];
    }

    nextSection(sectionSlug) {
        const currentSectionIndex = findIndex(
            this.sections,
            (section) => section.slug === sectionSlug
        );

        return this.sections[currentSectionIndex + 1];
    }

    previousPage({ baseUrl, sectionSlug, currentStepIndex = null, copy = {} }) {
        const currentSection = find(
            this.sections,
            (s) => s.slug === sectionSlug
        );

        const previousSection = this.previousSection(sectionSlug);

        if (currentStepIndex > 0) {
            const targetIndex = findLastIndex(
                currentSection.steps,
                (step) => step.isRequired === true,
                currentStepIndex - 1
            );
            return {
                label: currentSection.steps[targetIndex].title,
                url: `${baseUrl}/${currentSection.slug}/${targetIndex + 1}`,
            };
        } else if (currentStepIndex === 0 && currentSection.introduction) {
            return {
                label: currentSection.steps[0].title,
                url: `${baseUrl}/${currentSection.slug}`,
            };
        } else if (previousSection) {
            const targetIndex = findLastIndex(
                previousSection.steps,
                (step) => step.isRequired === true
            );
            return {
                label: previousSection.steps[targetIndex].title,
                url: `${baseUrl}/${previousSection.slug}/${targetIndex + 1}`,
            };
        } else {
            return {
                label: copy.navigation.summary,
                url: `${baseUrl}/summary`,
            };
        }
    }

    nextPage({ baseUrl, sectionSlug, currentStepIndex = null, copy = {} }) {
        const currentSection = find(
            this.sections,
            (section) => section.slug === sectionSlug
        );

        const nextSection = this.nextSection(sectionSlug);

        if (currentStepIndex === null && currentSection.introduction) {
            return {
                label: currentSection.steps[0].title,
                url: `${baseUrl}/${currentSection.slug}/1`,
            };
        } else {
            const targetIndex = findIndex(
                currentSection.steps,
                (step) => step.isRequired === true,
                currentStepIndex + 1
            );

            if (
                targetIndex !== -1 &&
                targetIndex <= currentSection.steps.length
            ) {
                return {
                    label: currentSection.steps[targetIndex].title,
                    url: `${baseUrl}/${currentSection.slug}/${targetIndex + 1}`,
                };
            } else if (nextSection) {
                return {
                    label: nextSection.steps[0].title,
                    url: `${baseUrl}/${nextSection.slug}`,
                };
            } else {
                return {
                    label: copy.navigation.summary,
                    url: `${baseUrl}/summary`,
                };
            }
        }
    }

    pagination(options) {
        return {
            nextPage: this.nextPage(options),
            previousPage: this.previousPage(options),
        };
    }

    fullSummary() {
        return this.getCurrentFields()
            .filter((field) => field.displayValue)
            .map((field) => {
                return {
                    label: field.label,
                    value: field.displayValue,
                };
            });
    }
}

module.exports = { FormModel };
