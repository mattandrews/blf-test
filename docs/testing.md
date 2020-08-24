# Testing

We rely on a number of different tools for testing our code. Please ensure that you write new tests when adding non-trivial new code, update existing tests when modifying functionality, and remove outdated tests which are no longer in use. Our confidence in a quick release cycle is built on top of these tests so if they become outdated and unreliable then our users' experience is likely to become unreliable, too. 

## Linting

We have the following linters configured to run during CI.

-   [eslint](https://eslint.org/) - Used for linting all client-side and server-side JavaScript
-   [stylelint](https://stylelint.io/) - Used for linting `.scss` stylesheets
-   [shellcheck](https://www.shellcheck.net/) - Used to check bash scripts

We _do not_ use linting to enforce stylistic choices. Instead we rely on [prettier](https://prettier.io/) to auto-format our code.

You can run `eslint` and `stylelint` manually by running:

```shell script
npm run lint
```

## Unit tests

Unit tests are run using [Jest](https://jestjs.io/). All out unit tests are collocated next to the files they test rather than in a top-level `tests` directory so you will see `.test.js` files throughout the project.

You can run the linted and unit tests with:

```shell script
npm test
```

To start a test runner which will notify you of test failures as you work you can run:

```shell script
npm run watch-tests
```

## End-to-end tests

We use [Cypress](https://www.cypress.io/) for end-to-end browser testing. These can be run locally with a headless browser with the following command:

```shell script
npm run test-integration
```

If you'd like to run cypress tests through the UI you can run the following:

```shell script
npm run start-test
```

In a new terminal

```shell script
npx cypress open
```

## Accessibility testing

As part of our Cypress tests we use `axe-core` to perform automated accessibility checks on key pages during our end-to-end tests. We accept that this kind of testing can only catch _some_ accessibility issues and is not a substitute for regular accessibility testing but running these smoke tests in an automated way catches common errors early.

## npm audit

As part of our CI step we run `npm audit` which checks our production npm dependencies for vulnerabilities. By running this during CI we can fail the build if any new vulnerabilities are discovered forcing us to act on security notices early and often.

## Dependabot

Related to the `npm audit` step we also have [Dependabot](https://dependabot.com/) configured as a GitHub app. This too regularly raises pull requests to keep our dependencies up to date. Automating this ensures we are kept up to date and reduces risk by encouraging us to merge dependency updates in small regular increments.
