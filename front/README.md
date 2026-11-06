# Yoga

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.16.

## Start the project

Git clone:

> git clone https://github.com/BenLen0826/openclassroom_projet_4.git

Go inside the front-end folder (from the repository root, `openclassroom_projet_4`):

> cd front

Install dependencies:

> npm install

Launch Front-end:

> npm run start;


### Test

Tests are organised in three levels:

| Level | Files | Tool |
|---|---|---|
| Unit (dependencies mocked) | `src/**/*.spec.ts` | Jest |
| Integration (real component + template + services, HTTP back-end simulated) | `src/**/*.integration.spec.ts` | Jest |
| End-to-end (one file per screen, back-end stubbed with `cy.intercept`) | `cypress/e2e/*.cy.ts` | Cypress |

Elements used by tests carry a `data-testid` attribute named `screen-subject-type`
(types: `action`, `field`, `option`, `text`, `message`, `item`), e.g. `login-submit-action`.
Add one when you add an element a test needs to find.

#### Unit and integration tests (Jest)

> npm run test

With coverage (fails if any indicator is below 80 %):

> npm run test:coverage

Reports: `front/coverage/jest/index.html` (coverage) and `front/coverage/jest/test-report.html` (results).

Watch mode:

> npm run test:watch

Only integration tests: `npx jest integration` · one file: `npx jest login` · one test: `npx jest login -t "wrong login"`

#### E2E (Cypress)

Stop `npm run start` first (Cypress serves the application on port 4200). The back-end does not need to run.

Interactive mode:

> npm run e2e

Headless mode (all tests, in the terminal):

> npm run e2e:ci

Generate coverage report (after a full e2e run):

> npm run e2e:coverage

Report is available here:

> front/coverage/lcov-report/index.html
