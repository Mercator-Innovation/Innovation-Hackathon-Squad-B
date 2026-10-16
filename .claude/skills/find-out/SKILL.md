---
name: find-out
description: Research on demand for anyone in the squad, at any time. Short answers with sources about the users, the problem, policy, open data, design patterns or how others have solved something, and optionally onto the squad's Discovery Wall. Also makes the Discovery Wall if the product owner wants one. Use when someone says "find out", "look into", "what's a good pattern for", or asks a question the challenge sheets don't answer.
---

# Find out

Research is something anyone does when they need it, not a stage. It's there to help the squad decide and build, so keep it short and useful.

## Answering

1. **Get the question clear in one line.** If it's vague, offer two or three sharper versions and let them pick.
2. **Look it up.** Start from `challenges/`, then search. The CivTech pages, gov.scot, gov.uk, statistics.gov.scot and the organisations' own sites are good sources.
3. **Answer in at most five bullets, each with its source.** Lead with what matters for the squad's idea. Say plainly what you couldn't find, and mark anything that's your own inference.
4. **Offer one next step:** "Want me to dig deeper into X?" or "Shall I turn this into content (or data, or a screen) for the prototype?"

Good things to find out:

- **Users:** who's affected, when, and what gets in their way.
- **Policy and context:** the strategy or law behind the challenge.
- **Open data** the prototype could use, or base synthetic data on.
- **Design patterns:** for example "what's a good accessible pattern for a 'what's open now' list?" The GOV.UK Design System, NHS digital service manual and other accessible pattern libraries are good references.
- **How others solved it:** similar services in other places.

Never make up facts, figures, quotes or sources. Never collect or use real personal data.

## The Discovery Wall (optional)

A shared page where the squad's findings, open questions and ideas collect in one place. It's optional, and squads that prefer talking can skip it.

**If `TEAM.md` has a Discovery Wall link:** after answering, offer once: "Add this to the wall?" If yes, add one item per finding to the wall's database, in the `items` collection: `{ person, kind, text, url, createdAt }`, where `kind` is `found`, `question` or `idea`. Keep each item to one sentence.

People can comment on any item on the wall and @mention a squad mate or Claude. If someone asks you to look into the wall's open questions, read the `question` items, research them, and write the answer into the item's `answer` field with its source.

**Making the wall** (the product owner, or someone they ask; once per squad):

1. Publish `discovery-wall.html` (in this skill's folder) as an artifact titled "<squad name> Discovery Wall", with the `db` and `user` capabilities. Don't change the HTML: the page sets its own title from the squad name.
2. Write `squad/info` in its database: `{ name, challenge, idea }` from `TEAM.md`.
3. Tell them how to share it: open the page, click **Share**, add each squad member with **edit access**, then **Copy link** and post it in the squad's Teams channel. Shared pages appear in everyone's **Artifacts** list in the left sidebar.
4. Add the link to `TEAM.md` under Links, and `/share` it.
