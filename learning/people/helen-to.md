---
# Answers as codes, for counting across squads. The questions and codes are in learning/questions.md.
name: Helen To
profession: QA Engineer
role: none
location: in person
# At setup
ai_use_before: 1
hopes: [build-fast]
feeling: excited
# At 19:00
worked_on: []
outside_usual_job:
got_in_way: []
ai_use_after:
# In the week after
specialist:
helped_squad: []
idea_where: []
ai_use_week_after:
---

# Helen To: learning log

## At setup
- How much I use AI tools in my work today: Never or hardly ever
- What I'm hoping to get from the hackathon: Build something real, fast
- How I feel about using AI in my work: Excited

## During
<!-- Claude adds one line per moment: prompts that worked (word for word), dead ends, surprises, things done outside my usual job, what made working as a squad easier or harder -->
- 16:35 sharing hit a clash: Simon and I had both added styles to the end of styles.css. Claude showed both, proposed keeping both, checked the whole prototype still worked, then merged. Other squad mates' work (visit planner, report cards) came in at the same time without problems.
- 16:40 I designed and built the dashboard's "Where to act first" section (clickable cards, trend chart, map view with traffic lights), normally a designer's and developer's job: I described what I wanted in one message, Claude built it, and I shared it to the squad's screen.
- 16:48 I asked to share again, but there was nothing new: everything was already in the squad's copy.
- 17:44 prompt: "add some test to the core functionality" then "use playwright for the testing of the UI" → Claude wrote 68 Playwright tests (risk scoring, Awaab's Law dates, traffic lights, data checks, dashboard clicks and keyboard, phone width, tenant form). My usual job, done far faster.
- 17:44 surprise: the tests caught a real bug in our made-up data (home H-1029 was one person who was both an older person and a young child). The test was right, so we fixed the data, not the test.
- 17:44 dead end: the tests were flaky at first because the Python preview server dropped files when many tests ran at once → switched to a tiny Node server and they passed every time.
- 17:55 surprise: testing the visit planner found a real bug: two follow-ups could be booked for the same person at overlapping times (only exact same start times were blocked). Simon knew, I fixed it and added a test so it stays fixed.
- 18:03 prompt: "if you are the people for home visit, we want an app, the core task is the visit, so we want an app for the workers visiting the home" then "the app can be on a tablet or phone" → Claude built a visit app joined up with the staff dashboard: what you record on a visit updates the case and plans the repair.
- 18:07 prompt: "use playwright to test this" → 16 tests for the visit app, all passed first time, then "add this as a tab view on the main desktop site" → a Visit app tab in a tablet or phone frame. I did product, design, build and testing, normally four different jobs.
- 18:12 squad: sharing small and often meant Petra's new colour palette arrived while I was building, so I could match it straight away.

## At 19:00
- What I worked on: <answers>
- How much of it was outside my usual job: <answer>
- What got in the way: <answers>
- How much I'd use AI tools in my work now: <answer>

## In the week after
- Did I still need a human specialist: <answer>, for <what>
- What helped most when building as a squad: <answers>
- The most useful thing I learned: <in my words>
- **One idea to carry forward:** <in my words>, and where it could fit: <answers>
- How much I expect to use AI tools from now on: <answer>

## Three-week check-in (around 12 Nov)
- Did I try, share or suggest my idea anywhere? What happened, or what got in the way?
