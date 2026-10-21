---
name: start-here
description: Welcome someone to their squad repo at the Mercator Innovation Hackathon. Checks their setup, finds them in TEAM.md, starts their learning log, proves sharing works, and runs the squad lead's setup. On the day, it starts the squad off by agreeing its name, which the product owner records, then says what the squad is doing now. Use at anyone's first session, on the day after "get the latest", when someone says "start here" or "what now?", or when they're unsure what to do.
---

# Start here

They may never have used Claude Code, git or a terminal. Keep each message to a few lines, and use several short messages rather than one long one.

## Which run is this?

Check today's date (`date +%F`). From `2026-10-22`, it's **the day**. (In the rehearsal repo, `CLAUDE.md` says to treat any day as the day.)

- **On the day, and they're already set up** (their learning log is in `learning/people/`): do step 1 quietly, then go straight to step 6, the squad name. Don't redo their log, the setup questions or the sharing test.
- **Anyone else:** steps 1 to 5 as below. On the day, carry on to step 6 afterwards.

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

## 3. The day in seven lines

> **15:05** Agree your squad name. The product owner records it.
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

Before the day, they're welcome to read `challenges/` and ask about them. Choosing the squad name, the challenge and the idea, and any building, are for the day. The name comes first, at 15:05.

## 6. On the day: first, the squad name

If `TEAM.md` has no squad name yet (it still says _chosen on the day_), that comes first, before the challenge:

1. Say: "First job: agree a name for your squad, together. It goes up on the big screen, and it earns your first badge of the day: **Name in lights**." Then give them a couple of minutes to talk.
2. **In the product owner's session** (check the Roles table): once the squad has agreed, ask for the name with `AskUserQuestion`: the names they were choosing between, if you heard them (up to four), with **Other** to type it. Write it into `TEAM.md` exactly as they say it (`**Squad name:** <name>`), then `/share` it. Then say: "It'll be on the big screen in a minute or two. Everyone else: say 'get the latest'."
3. **In anyone else's session:** say "Your product owner records it. Once they have, say 'get the latest'." Don't write it yourself.
4. **Stuck for ideas?** Offer four short, light-hearted names as clickable options, and say they're only suggestions. Any name: 40 characters at most, friendly, and with no one's real name and no real organisation's name in it, because it shows on the big screen and the website.
5. **No product owner in the room yet?** The squad lead's session records it, or whoever the squad picks. Only one person writes it.

If there's already a squad name, say it in one line ("You're **<name>**.") and move on.

## 7. On the day: what now?

Work it out from what exists, not the clock:

| What exists | Next |
|---|---|
| No squad name in `TEAM.md` | Agree a name together (step 6). The product owner records it |
| A name, no challenge | Pick a challenge together: `/challenges` on one screen. The product owner records it |
| A challenge, no idea | Talk it through together. Anyone can `/find-out` on the side. The product owner records the idea |
| An idea, nothing in `src/` | The merge captain runs `/first-version`. Everyone else: sketch, gather content or data, or `/find-out` something you'll need |
| A first version in `main` | **Grab and build.** Say what you'll improve, then ask for it in plain words. `/share` when it works |
| From 18:30 | Whoever the squad chose to present runs `/show-and-tell` |
| After 18:40 | `/share` what you have. Then, at 19:00, `/reflect` |

If the squad is working its own way, follow it.
