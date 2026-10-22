# Show and tell: Commitment issues (2 minutes)

**Presenting:** Okeli Okonye (picked at random; the squad can swap)
**Last updated:** 17:59, after pull request #34

Before your turn, tell Claude `get the latest and make it run for me`, so you show the squad's latest version. Join the Teams call from the link in the squad's Teams chat and share your screen when it's your turn.

## 0:00 to 1:00: What we built, and for whom

- **Who it's for:** staff at Cloch Housing Association. Cold, damp and mould make tenants ill, and Awaab's Law means landlords must act faster. Our prototype helps staff find the tenants most at risk *before* they get ill. All the data is made up.
- **What it does:** the Risk overview shows where to act first and why each home is flagged. Visits booked plans the visits: highest risk first, then the nearest, on a week calendar with route maps. Cases keeps one record per home, with repair notes and follow-ups. Tenants can report damp from their phone and track it.

**Click through (about 40 seconds):** Risk overview → Visits booked → Next week → click a visit → Open the case.

## 1:00 to 1:30: One thing that didn't work

- Five of us building one small prototype at once meant we kept changing the same files, like the overview cards and the case booking form, so our shares clashed. Claude kept both sides each time, but it slowed us down.
- Why: a few files everyone touches. Splitting each screen into its own file helped. Next time we'd agree who owns which file before we start.

## 1:30 to 2:00: One surprise from the tooling

- A whole visit planner went from an idea to the shared screen in under an hour: a calendar, route maps, and a plan that weighs risk against driving time. One person built it by describing it to Claude.
- And everyone built, whatever their job. Our QA engineer designed and built the dashboard's top section, then wrote 68 automated tests that caught a real mistake in our data. Our business analyst built the tenant's Track your report page.

---

## Shared so far today

| Time | Who | What |
|---|---|---|
| 15:55 | Petra | First version: staff risk dashboard and tenant report form |
| 16:07 | Helen | Age bands, repair notes and a suggested action for each home |
| 16:15 to 16:32 | Jim | Reports from tenants: clearer cards, filters and details |
| 16:31 | Helen | Where to act first: clickable cards and a trend chart |
| 16:34 | Simon | Visit planner: week calendar, who's where map, team hours |
| 16:40 | Simon | Cases: one case per home, with notes and follow-ups |
| 16:50 | Okeli | Tenant view: tick boxes, and a Track your report page |
| 16:50 | Petra | Homes to look at first: downloads, sorting, filters |
| 16:56 | Petra | Case booking: a reason for each visit, and a confirmation |
| 17:02 to 17:07 | Simon | Cases: filters and cards, calendar links, review fixes |
| 17:25 | Petra | Risk by area: back to a simple grid |
| 17:32 | Simon | Clearer words on the visit plan and Cases |
| 17:43 | Helen | 68 automated tests, and a fix to an impossible household in the data |
| 17:48 | Petra | Risk by area: a map and table side by side. Fixes from an expert review: reports close themselves when the work is done, and health details stay private |
| 17:55 | Petra | Downloads: small PDF and spreadsheet icons instead of outlined buttons |
| 17:57 | Petra | Removed the whole-page download icons |
| 17:58 | Helen | Tests for the visit planner, follow-up bookings and Track your report |
| 17:58 | Simon | A logo: a home with a heart, on every page (the squad picked it from four) |
