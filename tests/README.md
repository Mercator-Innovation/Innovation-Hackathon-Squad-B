# Tests

Playwright tests for the prototype in `src/`. The prototype itself still needs no installs: these are only for people who run the tests.

First time only, in the repo folder: `npm install`

Run them: `npm test` (or ask Claude "run the tests"). See a report you can click through: `npm run test:report`.

- `risk.spec.js`: risk scores, bands, suggested actions, Awaab's Law working days, traffic lights
- `data.spec.js`: the made-up data makes sense (no impossible households)
- `dashboard.spec.js`: the staff dashboard, clicked like staff would, by mouse and keyboard, and at phone width
- `tenant.spec.js`: the tenant report form, and that staff see the report
- `planner.spec.js`: the visit planner keeps its promises (no double-booking, working hours and days, the right people, high risk first, nothing forgotten) and booking follow-ups
- `track.spec.js`: Track your report reads references and shows the right progress
- `visit-app.spec.js`: the visit app on a phone and tablet: your visits, private reasons, saving findings and outcomes, and that staff see them
- `accessibility.spec.js`: axe checks against WCAG 2.2 AA on every page, tab and pop-up, at desktop and phone width, plus keyboard and focus checks
