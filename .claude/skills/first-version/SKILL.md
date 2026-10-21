---
name: first-version
description: Turn the squad's loosely described idea into a working first version of the prototype in src/, fast, so it's on the shared screen within about 20 minutes and everyone can start grabbing things to improve. For the driver (usually the merge captain). Use when the squad has talked the challenge through and someone says "build a first version", "get something on screen" or "first version".
---

# First version

The goal is **something the squad can look at and react to**, quickly. It will be rough, and that's the point: once it's on screen, everyone can say "I'll improve that".

## 1. Get the idea in their words (2 minutes)

- Read the challenge and **The idea** in `TEAM.md`. If there's no idea yet, ask the driver to describe it loosely: who it's for, when they'd use it, and what it does. A sketch or whiteboard photo in `sketches/` counts too.
- Ask **at most two** quick questions, only if you really need them, as clickable options in one `AskUserQuestion` call (for example "Phone or laptop?"). Otherwise pick sensible defaults and say what you picked.
- If the product owner hasn't recorded the idea and this is their session, offer to write it into `TEAM.md`.

## 2. Build it (10 to 15 minutes)

- **Plain HTML, CSS and JavaScript** in `src/`, opening straight from the file: no build step, no installs, no frameworks unless the squad asks.
- **Clickable end to end:** the main journey works from start to finish, even if each step is basic. Mobile first if people will use it on a phone.
- **Synthetic data only**, realistic enough to feel real, in `src/data/*.js` (`window.DATA = …`).
- **Split it so people can work in parallel** without changing the same file:
  - `src/index.html`: the page structure
  - `src/styles.css`: the look (colours and fonts as variables at the top)
  - `src/app.js`: behaviour
  - `src/data/`: the synthetic data
  - `src/content.js`: the words people see, if there's much text, so a content person can rewrite it without touching the code
  - one file per extra screen, if there are several
- **Accessible from the start:** headings in order, labels, keyboard use, decent contrast.
- Keep it honest: no logos or branding of real organisations.

## 3. Put it on the shared screen

1. Show it: serve `src/` and open it in the browser, as **Preview** in `CLAUDE.md` says (http://localhost:8766/), rather than opening the file. Do it yourself, then ask the driver to drag the window to the big screen.
2. `/share` it, so it's in `main` and everyone can get the latest. Then the merge captain sets up the shared screen properly with `/merge-captain`, so it keeps showing the latest version while they build too.
3. Say in two lines what it does and what's deliberately rough.

## 4. Hand it to the squad

Offer a short list of **things people could grab**, 6 to 10, each tagged with the file it mostly touches. Mix them across professions, for example:

- Rewrite the words so they're kind, plain and person-first (`content.js`)
- Make it look right for the people using it: colours, type, spacing (`styles.css`)
- Make it work well on a phone, and check it with a keyboard (`styles.css`, `index.html`)
- Richer, more realistic synthetic data (`src/data/`)
- A second screen or step in the journey (a new file)
- A small back end or database, if the squad wants one (new files, talk to the merge captain first)
- Find out whether the main assumption holds, then change the prototype (`/find-out`)

Read the list out, don't assign it. The product owner says "go", people call what they'll grab, and the merge captain keeps an eye on anyone heading for the same file.
