# Showcase: Commitment issues (10 minutes)

**When:** Wed 25 November, 14:00 to 15:40, on Teams. We're on seventh. (Moved from 11 Nov.)
**Slot:** up to 9 minutes presenting, then 1 minute for questions.
**Presenting:** _(squad to choose: live, or a recording to Sheldon Gold by Tue 24 Nov)_
**Draft:** 13 Nov, updated 23 Nov with everyone's reflections except Okeli's. About 1,200 spoken words.

Gaps to fill before the day are marked **[ask]**. Most are things only the person can say.

---

## 0:00 to 1:15: The challenge and what we built

- **The challenge:** Healthier homes. Find tenants at risk from cold, damp and mould *before* they get ill. Awaab's Law means landlords now have to act faster. Four of the eight squads took this one on.
- **Who we built it for:** staff at a made-up housing association, Cloch, in Inverclyde. And their tenants. All our data is made up.
- **What we built, in one journey** (click through as you say it, about 45 seconds):
  - **Risk overview:** every home has a risk score, with the reasons shown, so a person decides, not the score. A heat map shows the hotspots.
  - **Visits booked:** highest risk first, then nearest. A week calendar, and a route map with the driving time for each leg.
  - **Cases:** one record per home: notes, follow-ups and history.
  - **Home visit:** an app for the phone or tablet at the door. What you record updates the case and plans the repair.
  - **For tenants:** report damp, mould or cold from your phone, then track what happens.

## 1:15 to 2:30: How the afternoon actually went

- **Our numbers** (from the facilitators):
  - 84 commits and 55 merges between 15:00 and the hard stop.
  - First version on the shared screen at **15:55**, second only to Squad H.
  - 29 commits in the last 30 minutes, the most of any squad. Our busiest ten minutes: 14 commits from 18:00.
  - 9 fixes and 10 test commits, both the most of any squad.
  - All **26 badges**. Only three squads got the full set.
  - A fair warning from Petra: next time, "not base the rewards on number commits". Lots of commits isn't the same as lots of value.
- **The shape of it:**
  - 15:11 name, 15:34 challenge, 15:55 Petra's first version.
  - 16:00 to 17:00: everyone grabbed a piece. Jim took tenant reports, Helen "Where to act first", Simon the visit planner and Cases, Okeli the tenant view, Petra the risk list.
  - 17:00 to 18:00: reviews and tests. AI reviewers found real problems; Helen's tests found real bugs.
  - 18:00 to 18:40: a new look, a logo, the Home visit app, the hotspot map and accessibility fixes, all in the last 40 minutes.
- **We skipped the 17:15 look together.** We were meant to stop and try the prototype as a housing officer would. Instead we kept building. With hindsight, ten minutes as the user might have saved some of the rework.

## 2:30 to 3:30: What didn't work, and why

- **We kept clashing.** Five people changed the same few files at once. Claude merged both sides each time, but it slowed us down. Okeli says working as a squad (clashes, waiting) was what got in the way most.
- **Not every idea stuck.** The first map didn't work, so Petra took it out. Later she tried a ranked list in place of the area table and rolled it back two minutes later. Trying and undoing was cheap, which helped.
- **Claude isn't a logo designer.** Simon: "Claude's ability to make logos isn't amazing." Two rounds of simple house icons, then Petra recoloured it by hand.
- **Flaky tests.** Helen's first test run kept failing, because the simple preview server dropped files under load. A small switch of server fixed it.

## 3:30 to 4:45: Where the tooling surprised us

- **Tests that caught real bugs.** Helen asked: *"add some test to the core functionality"*, then *"use playwright for the testing of the UI"*. That gave 68 automated tests (113 by the end). They found a home where one person was both an older person and a young child. "The test was right, so we fixed the data, not the test." They also found that two visits could be booked at overlapping times.
- **An expert panel on demand.** Petra attached our whiteboard sketch and asked Claude to *"imagine youre the best service, product, interaction and content designer, but youre also an amazing developer, BA etc. I want you to improve everything"*. A five-expert review found 50 issues. The biggest got fixed: reports now close after a visit, and health reasons stay out of texts and downloads.
- **Reviews of each other's work.** Simon: three AI reviewers checked Cases and "found 27 real problems", including sample data that never reached the shared screen.
- **The presentation built itself.** Simon kept the 2-minute outline up to date from everyone's shares, so the presenter never had to chase anyone. Then he made a page that reads it aloud in a Scottish voice.

## 4:45 to 6:30: Who did what outside their usual job

- **Helen (QA engineer):** designed and built "Where to act first", then the whole Home visit app: *"we want an app for the workers visiting the home"*. Then she tested it and picked its name. "I did product, design, build and testing, normally four different jobs." What she learned: "you don't need to be an expert to create, design a working app ... where you don't understand, AI tools can explain to you how and why in a simple plain english language."
- **Jim (content designer):** redesigned the tenant report cards, added filters and sample data, and did accessibility fixes at the hard stop. "It went well, by describing each change in plain words and checking it in the browser." He never needed a developer's help. What stayed with him: "the speed at which you can create a working prototype was certainly eye-opening."
- **Petra (service designer, merge captain):** built the first version and the most changes of anyone after Simon (55). She also built the new terracotta look, the risk map and the expert review. Her help from people was "mainly about the set up and github stuff". What she learned: "i didnt realise how powerful Claude can be in building".
- **Simon (software developer):** the visit planner, Cases, the map with driving times, and the logo. He also kept the show and tell going, which is more a delivery manager's job. What he needed from others: "Visuals, logos, initial planning was very well organised by Petra". His biggest lesson wasn't about AI: "Team work, version control as a team".
- **Okeli (business analyst, product owner):** chaired the squad, recorded our decisions, and built the tenant view and "Track your report". That's design and words, not analysis. **[ask Okeli]** One moment that stood out?

## 6:30 to 7:30: What made working as a squad with AI easy or hard

- **Easy:** small, frequent shares. Petra's new colours reached Helen while she was building, so she matched them straight away. Simon added Helen's work to the outline before she asked.
- **Easy:** a mixed squad. Everyone enjoyed or loved it, and four of the five named "working in a mixed squad" among what worked best.
- **Easy:** talking it through first, and the shared screen. Everyone who answered picked both.
- **Hard:** everyone in the same files at once (see above). Next time we'd agree who owns which file before we start. Simon wanted "something visual to keep track of features, tasks and progress".
- **Hard:** building was so quick that we never stopped to look together. That's easy to do when every change takes minutes.
- **Honest views:**
  - Petra, at setup, on using AI: "Not great due to environmental impact but needing to keep up."
  - Simon, at setup: "Obsolete :D (partially joking)."
  - Petra would come back "because of the community", but "because I'm trying not to use AI as much, I probably wouldn't".
  - Simon felt the challenges were narrow: "a lot of it being a website over some mock data".
  - Helen went from using AI "never or hardly ever" to expecting to use it now and then.
  - Okeli felt the second build session was "slightly long, maybe reduce to half an hour / 45 mins".

## 7:30 to 8:15: Ideas to carry forward, and where they went

- **Jim:** use Claude to brainstorm journey maps, where clients allow it. He's already used what he learned to build a working prototype for his team project on an SDN course.
- **Helen:** take on the challenge no squad tried, and build a solution. Not yet: she joined a new project team.
- **Simon:** "More projects that allow AI use". His client project doesn't allow AI, so "Hackathon learnings also don't really apply to it".
- **Petra:** no idea to carry forward: she's leaving Mercator soon.
- **Okeli:** **[ask Okeli]** One idea, and has it gone anywhere?
- **The honest pattern:** the ideas are there. Client rules, new projects and moving on are what's stopped them, not the tools.

## 8:15 to 9:00: What Mercator should take from this

- **Job titles didn't limit anyone.** A QA engineer built an app, a content designer wrote code, a service designer ran the merges.
- **AI made trying things cheap,** so we tried more, and rolled back without fuss.
- **Testing and review still matter more, not less.** The bugs we found came from tests and reviews, not from the building.
- **Teams need a little structure to build together:** who owns which file, and a shared plan. Building is now faster than coordinating.
- **Learning sticks only where people can use it.** Some of us can't use these tools on client work, so the skills risk fading. Internal work and bids could keep them going.

**Close:** "Thanks for listening. Any questions?"

---

## Before the day

- Fill the two **[ask Okeli]** gaps: Okeli can say `reflect` to Claude, or tell the presenter.
- Choose who presents, and whether it's live or recorded (recording to Sheldon by Tue 24 Nov).
- Practise the click-through once. Tell Claude `get the latest and make it run for me` first.
- Time it out loud. If it runs long, cut from "How the afternoon went" first.
