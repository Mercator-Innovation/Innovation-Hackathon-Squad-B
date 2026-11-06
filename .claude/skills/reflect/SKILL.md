---
name: reflect
description: Capture learning for one person in their learning log, with clickable multiple-choice questions. During the day, notes a moment in one line. At 19:00, asks four quick end-of-day questions, four about their experience of the hackathon, and one thing to change next time. In the week after, walks through the short reflection, then the three-week check-in. Saying "reflect" catches up on every part not done yet. Use when someone says "note that", "log this" or "reflect", at the end of the day, or when Claude spots a moment worth keeping.
---

# Reflect

Each person's log is `learning/people/<firstname>-<lastname>.md`. If it doesn't exist, copy `_template.md` first. The exact questions, options and codes are in `learning/questions.md`: use them word for word.

**Ask with clickable options** (the `AskUserQuestion` tool). People pick one or more answers, or choose **Other** and type. Write each answer twice: its code in the log's front matter (for counting), and in words in the matching section. If someone typed under Other, keep their exact words and use the code `other`.

## When someone says "reflect": catch up on everything that's missing

Read their log first, then run every part that's still blank, in this order, one straight after another:

1. **At 19:00**, if `ai_use_after` is blank
2. **In the week after**, if `ai_use_week_after` is blank
3. **The three-week check-in**, if `idea_tried` is blank

Say in one line what's left and that it takes about five minutes. Then `/share` once, at the end. If everything is already done, thank them and offer to note a moment instead.

## During the day: one moment, one line

When something notable happens, offer once, briefly: "Worth noting that?" If yes, ask what kind of moment it was, as one single-choice question: **A prompt that worked · A dead end · A surprise · Something outside my usual job** (Other for anything else). Then ask for, or suggest, the one line, and add it under **During**:

- **Prompt that worked** (copy it word for word): `HH:MM prompt: "<prompt>" → <what happened>`
- **Dead end:** `HH:MM dead end: <what we tried> → <why it didn't work>`
- **Surprise:** `HH:MM surprise: <what>`
- **Outside my usual job:** `HH:MM I <did what>, normally <whose job>: <how it went>`
- **Other** (often about working as a squad): `HH:MM <what>`

It goes in with their next `/share`. Don't interrupt someone in the middle of building: offer it when they pause or share.

## At 19:00: two quick calls and one line (three minutes)

1. Ask the first four **At 19:00** questions from `learning/questions.md` in one `AskUserQuestion` call.
2. Then say, in one line: "Four quick ones about the hackathon itself. Be honest: it helps us make the next one better." Ask the four **about the hackathon** questions in a second call.
3. Then ask, in their own words: "One thing we should change next time?" Keep their words exactly, and take "nothing" or a skip as an answer.
4. Fill in the front matter and the **At 19:00** section, then `/share`.

Most logs were started before these questions were added, so they don't have the hackathon lines yet. Add them as in `_template.md`: `enjoyed`, `pace`, `worked_best` and `again` in the front matter after `ai_use_after`, and the five lines at the end of **At 19:00**.

## In the week after: the reflection

Ask the **In the week after** set in one call, then the two questions in their own words, one at a time. Keep their words; don't polish them. Fill in the front matter and the section, then `/share`.

## The three-week check-in

Ask the **Three-week check-in** question from `learning/questions.md` in one call, then, in their own words: "What happened, or what got in the way?" Keep their words exactly. Fill in `idea_tried` and the **Three-week check-in** section, then `/share`.

Older logs don't have `idea_tried` yet: add it at the end of the front matter, after `ai_use_week_after`, under a `# Three-week check-in` comment. Write the section as in `_template.md`, replacing the old one-line question if it's there.
