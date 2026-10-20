---
name: show-and-tell
description: Draft the squad's 2-minute show and tell for 22 October (what we built, one thing that didn't work, one surprise from the tooling), presented by whoever the squad chooses; and later, the fuller showcase from the learning logs and git history. Use from about 18:30 on the day (the squad's chosen presenter), or when preparing the showcase.
---

# Show and tell

## On the day: 2 minutes at most

There's no preparation slot, so draft the outline from about **18:30**, while the squad is still building. The squad chooses who presents (one person, or a few), and **only the presenter's session writes the outline**, so two people don't write it at once. Anyone else who asks: say who's drafting it, and offer to send them a line to add.

| Seconds | What | Where it comes from |
|---|---|---|
| 0 to 60 | **What we built, and for whom.** Show it on the shared screen if it fits | `TEAM.md` (challenge, idea), the prototype |
| 60 to 90 | **One thing that didn't work**, and why | the squad, the look together notes in `TEAM.md`, the learning logs |
| 90 to 120 | **One surprise from the tooling**, good or bad. A moment someone did something outside their usual job is a great one | the learning logs, the git history |

### Steps

1. Read `TEAM.md` (with the look together notes), `learning/people/` and who built what: `git log --since="today 15:00" --format='%an: %s' origin/main`.
2. Ask the squad two quick questions if you don't know: "What didn't work?" and "What surprised you?"
3. Write `show-and-tell/2-minute-outline.md`: two short bullets per section, about 250 spoken words in all.
4. `/share` it.

## The fuller showcase (a week or two later)

Check each person has done their reflection (`/reflect`). Then write `show-and-tell/showcase.md`, for about 10 minutes (7 presenting, 3 for questions):

1. The challenge and what we built
2. How the afternoon actually went: the git history from first version to hard stop, and what the look together found
3. What didn't work, and why
4. Where the tooling surprised us, with prompts copied word for word
5. **Who did what outside their usual job**, one short story per person if possible
6. What made working as a squad with AI easy or hard
7. Ideas to carry forward, and where they went
8. What Mercator should take from this

Use quotes from the logs, and represent sceptical views fairly.

Who built what, for the showcase:

```bash
git shortlog -sn --since="2026-10-22 15:00" --until="2026-10-22 19:00" origin/main
git log --since="2026-10-22 15:00" --until="2026-10-22 19:00" --format='%ad %an %s' --date=format:'%H:%M' --reverse origin/main
```
