import $ from 'jquery';
import Vue from 'vue';
import { storageAvailable } from '../helpers/storage';
const canStore = storageAvailable('localStorage');

function init() {
    new Vue({
        el: '#js-survey',
        data: {
            lang: null,
            survey: null,
            status: 'NOT_SUBMITTED',
            showMessageBox: false,
            response: {
                choice: null,
                message: null,
                path: window.location.pathname
            }
        },
        created: function() {
            // normalise URLs (eg. treat a Welsh URL the same as default)
            const uri = window.location.pathname.replace(/\/welsh(\/|$)/, '/');
            const localePrefix = window.AppConfig.localePrefix;
            $.get(`${localePrefix}/surveys?path=${uri}`).then(response => {
                if (response.status === 'success' && this.hasTakenSurvey(response.survey.id) === false) {
                    this.lang = response.lang;
                    this.survey = response.survey;
                }
            });
        },
        methods: {
            getSurveysTaken() {
                let takenIds = [];
                if (canStore) {
                    const storageData = window.localStorage.getItem('surveys-taken');
                    takenIds = storageData ? JSON.parse(storageData) || [] : [];
                }
                return takenIds;
            },
            hasTakenSurvey(surveyId) {
                const surveysTaken = this.getSurveysTaken();
                return surveysTaken.indexOf(surveyId) !== -1;
            },
            setSurveyTaken(surveyId) {
                if (canStore) {
                    if (this.hasTakenSurvey(surveyId) === false) {
                        const surveysTaken = this.getSurveysTaken();
                        surveysTaken.push(parseInt(surveyId));
                        window.localStorage.setItem('surveys-taken', JSON.stringify(surveysTaken));
                    }
                }
            },
            storeResponse(choiceId) {
                this.response.choice = choiceId;

                $.ajax({
                    url: `/survey/${this.survey.id}`,
                    type: 'POST',
                    dataType: 'json',
                    data: this.response
                }).then(response => {
                    if (response.status === 'error') {
                        this.status = 'ERROR';
                    } else {
                        this.status = 'SUCCESS';
                        this.setSurveyTaken(this.survey.id);
                    }
                }, () => (this.status = 'ERROR'));
            },
            selectChoice(choice) {
                if (choice.allowMessage) {
                    this.showMessageBox = true;
                } else {
                    this.storeResponse(choice.id);
                }
            }
        },
        template: `
<aside role="complementary" class="survey" v-if="survey">
    <div class="inner">
        <div class="survey__choices" v-if="status === 'NOT_SUBMITTED' && !showMessageBox">
            <span class="survey__choices-question">{{ survey.question }}</span>
            <div class="survey__choices-actions">
                <button class="btn btn--small survey__choice" type="button"
                    v-for="choice in survey.choices"
                    v-on:click="selectChoice(choice)"
                >{{ choice.title }}</button>
            </div>
        </div>

        <p class="survey__response" v-if="status === 'SUCCESS'">
            {{ lang.success }}
        </p>

        <p class="survey__response" v-if="status === 'ERROR'">
            {{ lang.error }}
        </p>

        <div class="survey__extra"
            v-for="choice in survey.choices"
            v-if="status === 'NOT_SUBMITTED' && choice.allowMessage && showMessageBox"
        >
            <form class="survey__form" v-on:submit.prevent="storeResponse(choice.id)">
                <label class="ff-label" for="survey-extra-msg">{{ lang.genericQuestion }}</label>
                <textarea class="ff-textarea spaced--s" id="survey-extra-msg"
                    :placeholder="lang.genericPrompt"
                    v-model="response.message"
                ></textarea>
                <input type="submit" class="btn btn--small" :value="lang.submit" />
            </form>
        </div>
    </div>
</aside>
`
    });
}

export default {
    init
};
