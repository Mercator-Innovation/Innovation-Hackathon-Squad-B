# Showcase: Commitment issues (10 minutes)

**When:** Wed 25 November, 14:00 to 15:40, on Teams. We're on seventh. (Moved from 11 Nov.)
**Slot:** up to 9 minutes presenting, then 1 minute for questions.
**Presenting:** all of us, live. Four sections of about 2 minutes 15 each (about 300 spoken words each).
**Draft:** 13 Nov, reshaped 23 Nov into four sections with everyone's reflections except Okeli's.

| Time | Section | Who |
|---|---|---|
| 0:00 to 2:15 | What we built (with the demo) | Jim |
| 2:15 to 4:30 | Our approach, and what it was like | Okeli |
| 4:30 to 6:45 | What we learned | Simon |
| 6:45 to 9:00 | What's next, then questions | Helen |

Gaps to fill before the day are marked **[ask]**.

---

## 1. What we built (Jim, 0:00 to 2:15)

- **The challenge:** Healthier homes. Find tenants at risk from cold, damp and mould *before* they get ill. Awaab's Law means landlords now have to act faster. Four of the eight squads took this one on.
- **Who it's for:** staff at a made-up housing association, Cloch, in Inverclyde, and their tenants. All our data is made up.
- **The demo: follow one home through** (about 90 seconds, click as you say it). **[ask]** Pick the home and practise the clicks once.
  1. **For tenants:** a tenant reports mould from their phone.
  2. **Risk overview:** the home shows near the top, with the reasons it was flagged, so a person decides, not the score. A heat map shows the hotspots.
  3. **Visits:** highest risk first, then nearest. A week calendar and a route map with driving times.
  4. **Home visit:** the officer records what they find on a tablet. That updates the case and plans the repair.
  5. **Cases and Track your report:** one record per home, and the tenant can see what's happening.
- **Hand over:** "Okeli will tell you how we got there."

## 2. Our approach, and what it was like (Okeli, 2:15 to 4:30)

- **How we started:** 15:11 name, 15:34 challenge, and Petra's first version on the shared screen at **15:55**, second only to Squad H.
- **Everyone grabbed a piece:** Jim took tenant reports, Helen "Where to act first", Simon the visit planner and Cases, Petra the risk list, and Okeli the tenant view.
- **Everyone worked outside their usual job:**
  - Helen (QA engineer) designed, built and tested the Home visit app: "normally four different jobs".
  - Jim (content designer) redesigned the report cards and never needed a developer's help.
  - Petra (service designer) built the first version and ran the merges.
  - Simon (developer) kept the show and tell going, more a delivery manager's job.
  - Okeli (business analyst) chaired the squad and designed screens and words. **[ask Okeli]** One moment that stood out?
- **Small, frequent shares:** 84 commits and 55 merges. Petra's new colours reached Helen while she was building, so she matched them straight away.
- **The hard parts:**
  - Five people changed the same files at once, so we kept clashing. Claude merged both sides, but it slowed us down.
  - We skipped the 17:15 look together and kept building. With hindsight, ten minutes as a housing officer would have saved rework.
- **What it felt like:** everyone enjoyed or loved it, and four of five named the mixed squad among what worked best. The second build session felt "slightly long".
- **Hand over:** "Simon will tell you what we learned."

## 3. What we learned (Simon, 4:30 to 6:45)

- **Where Claude surprised us:**
  - **Tests that caught real bugs.** Helen asked: *"add some test to the core functionality"*, then *"use playwright for the testing of the UI"*. That gave 113 tests by the end. They found a person who was both an older person and a young child, and two visits booked at overlapping times.
  - **An expert panel on demand.** Petra asked Claude to *"imagine youre the best service, product, interaction and content designer, but youre also an amazing developer, BA etc. I want you to improve everything"*. It found 50 issues, and the biggest got fixed.
  - **Reviews of each other's work.** Three AI reviewers checked Cases and "found 27 real problems".
- **What didn't work:**
  - "Claude's ability to make logos isn't amazing." Petra recoloured it by hand.
  - The first map didn't work, so we took it out. Trying and undoing was cheap.
  - Lots of commits isn't the same as lots of value: Petra suggests "not base the rewards on number commits".
- **What each of us took away:**
  - Jim: "the speed at which you can create a working prototype was certainly eye-opening."
  - Petra: "i didnt realise how powerful Claude can be in building".
  - Simon: "Team work, version control as a team".
- **Honest views:** Petra worries about AI's environmental impact and is "trying not to use AI as much". Simon found the challenges narrow: "a lot of it being a website over some mock data".
- **Hand over:** "Helen will tell you what's next."

## 4. What's next (Helen, 6:45 to 9:00)

- **Our ideas, and where they went:**
  - "Jim used what he learned to build a working prototype for his SDN course. He'd like to use Claude for journey mapping, where clients allow it."
  - "I'd like to take on the challenge no squad tried and build a solution. I haven't yet, because I joined a new project team."
  - "Simon wants more projects that allow AI. His client project doesn't, so the skills don't carry over."
  - "Petra is leaving Mercator soon." **[ask Okeli]** Okeli's idea, and has it gone anywhere?
  - "So the ideas are there. What's stopped them is client rules and changes of project, not the tools."
- **What Mercator should take from this:**
  - Job titles didn't limit anyone. "I'm a QA engineer, and I designed, built and tested an app."
  - AI made trying things cheap, so we tried more and rolled back without fuss.
  - Testing matters more, not less. Our bugs were found by tests and reviews.
  - Teams need a little structure: who owns which file, and a visual plan, as Simon suggested.
  - Skills fade if you can't use them. Internal work and bids could keep them going.
- **Close:** "What I learned most: you don't need to be an expert to build something that works, because Claude explains the how and why in plain English. Thanks. Any questions?"

---

## Before the day

- Fill the **[ask]** gaps: the demo home (Jim), and Okeli's moment and idea.
- Whoever demos: tell Claude `get the latest and make it run for me` first. Have screenshots ready in case screen sharing fails.
- Rehearse once together, with a timer. If a section runs long, cut its lists first.
