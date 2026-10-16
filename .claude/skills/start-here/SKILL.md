---
name: start-here
description: Welcome someone to their squad repo at the Mercator Innovation Hackathon. Checks their setup, finds them in TEAM.md, starts their learning log, proves sharing works, and runs the squad lead's setup. On the day, says what the squad is doing now. Use at anyone's first session, when someone says "start here" or "what now?", or when they're unsure what to do.
---

# Start here

They may never have used Claude Code, git or a terminal. Keep each message to a few lines, and use several short messages rather than one long one.

## 1. Check the setup (quietly, then report in one line)

```bash
git --version
git rev-parse --show-toplevel
git remote -v
git status
gh auth status
printenv GH_TOKEN >/dev/null && echo "GH_TOKEN is set"
```

Then bring in the latest `main` (only if they have no uncommitted changes; otherwise ask first), and check `NOTICES.md`.

If something's wrong, explain the fix in plain English and offer to walk them through it:

- **No git:** on a Mac, `xcode-select --install`. On a Mercator laptop, turn on **Admin On-demand** in the **Self Service** app first.
- **Not at the repo root** (`--show-toplevel` isn't the current folder, or there's no repo here): the repo was cloned into a subfolder, so the squad's skills haven't loaded. Ask them to click the folder name above the chat box, choose **Change folder**, and open the folder with `README.md` and `TEAM.md` in it, then start a new chat there.
- **GitHub sign-in fails:** suggest `gh auth login` (GitHub.com, HTTPS, browser), then `gh auth setup-git`. Tell them to click the play icon, type `Y` in the terminal, and paste the one-time code into the GitHub page. It's safe to approve.
- **`GH_TOKEN is set` and sign-in fails:** a token for another account (often a client's) is set on their laptop and gets in the way. Explain that in a line, and suggest a facilitator or a developer at a drop-in helps them. Don't change their shell settings yourself.
- **No `gh`** (the GitHub command line tool, which sharing needs): offer to install it. On a Mac with Homebrew, `brew install gh`; otherwise the installer from cli.github.com. On a Mercator laptop, turn on **Admin On-demand** in the **Self Service** app first. Then sign in as above.

## 2. Who they are

1. Ask their name if you don't know it, find them in the Members table of `TEAM.md` and confirm their profession in one line. If they aren't there, don't edit the Members table yourself (several people doing that at once clashes): suggest they tell their squad lead or a facilitator, and carry on.
2. Copy `learning/people/_template.md` to `learning/people/<firstname>-<lastname>.md` (lowercase, hyphens) and fill in the header.
3. Ask the **At setup** questions from `learning/questions.md` in **one** `AskUserQuestion` call, word for word: clickable options, where they pick one or more, or choose **Other** and type. There are no wrong answers. Write each answer into their log twice: its code in the front matter and in words under **At setup**. If the clickable options aren't available, ask the same questions in chat as numbered options.

## 3. The day in six lines

> **15:10** Pick a challenge, together.
> **15:30** Talk it through: who's struggling, when, and what would help.
> **15:50** The merge captain gets a first version on the shared screen.
> **16:10 to 18:40** Everyone grabs something to improve, builds it and shares it, with a look together at 17:15.
> **18:40** Show and tell: 2 minutes.
> The one rule: **everyone builds**, whatever their job.

## 4. Prove sharing works

Use `/share` to commit their learning log on the branch `<firstname>-<lastname>/work`, open a pull request and merge it. Then:

- Tell them: "That's sharing working: your log is in the squad's shared copy."
- Ask them to type `/` and check that **share**, **challenges** and the other skills appear. If they don't, say plain English works too, and suggest a new chat in the repo folder.
- Pass on two tips: **Tab then Enter** accepts a suggested prompt, and they can type while you work.
- Suggest they post "I'm set up" in their squad's Teams chat.

## 5. The squad lead (before the day)

Check the Squad lead column in `TEAM.md`.

- **If this person is the squad lead:** say that they run the squad's setup. Help them agree the two roles in the Teams chat by Wed 21 Oct (a product owner, often them, and a merge captain, who doesn't need to be a developer: someone happy to drive the shared screen and keep things in order). When they're ready, ask who has each role as clickable options listing the squad's members (up to four names; anyone else goes under Other), then write the roles into `TEAM.md` and share it. Then check who hasn't set up yet: everyone with a learning log in `main` has.
- **Anyone else:** say in one line who their squad lead is, that the squad lead sorts out roles, and that they can talk about it in the Teams chat. Don't run the squad setup for them.

Before the day, they're welcome to read `challenges/` and ask about them. Choosing the challenge, the squad name and the idea, and any building, are for the day.

## 6. On the day: what now?

Work it out from what exists, not the clock:

| What exists | Next |
|---|---|
| No challenge in `TEAM.md` | Pick a challenge together: `/challenges` on one screen. The product owner records it |
| A challenge, no idea | Talk it through together. Anyone can `/find-out` on the side. The product owner records the idea |
| An idea, nothing in `src/` | The merge captain runs `/first-version`. Everyone else: sketch, gather content or data, or `/find-out` something you'll need |
| A first version in `main` | **Grab and build.** Say what you'll improve, then ask for it in plain words. `/share` when it works |
| From 18:30 | Whoever the squad chose to present runs `/show-and-tell` |
| After 18:40 | `/share` what you have. Then, at 19:00, `/reflect` |

If the squad is working its own way, follow it.
