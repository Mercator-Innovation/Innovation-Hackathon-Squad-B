---
name: merge-captain
description: For the squad's merge captain. Sets up the shared screen so it always shows the latest main (even while the merge captain builds on their own branch), keeps it refreshed, shows who is changing which files, spots people about to change the same files, and helps with clashes. Use when the merge captain says "set up the shared screen", "who's on what?", "refresh the screen", "anything clashing?", or runs it on a loop.
---

# Merge captain

The merge captain keeps the squad's work flowing: the shared screen shows the latest version, and people who'd change the same files go one after the other. Shares merge themselves when they're clean, so the merge captain only steps in when something clashes.

Suggest they keep **a separate chat** for this (a new chat in the same folder), so their building chat stays clear.

## Set up the shared screen (once)

**Do all of this yourself**, without asking the merge captain to run anything: they only drag the window to the big screen. The shared screen shows `main` from its own copy, in `.screen/` (git ignores it), so the merge captain can build on their own branch at the same time. Set it up once the first version has been shared (before that, `/first-version` shows it from the merge captain's own copy).

```bash
git fetch origin
[ -d .screen ] || git worktree add --detach .screen origin/main
git -C .screen checkout --detach origin/main
```

Then **serve it from a small local web server and open that, never the file itself**. Everyone's repo is in the Documents folder, and a browser on a Mac often isn't allowed to read the files beside a page there, so an opened file shows bare boxes with no words or colours. The server avoids that. Start it only if it isn't already running:

```bash
if ! curl -s -o /dev/null http://localhost:8765/; then
  nohup python3 -m http.server 8765 --bind 127.0.0.1 --directory .screen/src >/dev/null 2>&1 &
  sleep 1
fi
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8765/     # 200: the screen is being served
open http://localhost:8765/                                         # on a Mac
```

- Tell the merge captain in one line: "The shared screen is open in your browser. Drag it to the big screen, and make it full screen with **Ctrl+Cmd+F**." For a remote squad, they share that browser window on the Teams call instead.
- **If it isn't 200** (no `python3`, or the port is taken), try port 8775 the same way. If that fails too, open the file (`open .screen/src/index.html`), and if that shows bare boxes, suggest System Settings → Privacy & Security → **Files & Folders** → Google Chrome → **Documents Folder**, then quitting and reopening Chrome.
- **On Windows**, opening the file is fine: `start .screen\src\index.html`.

## Keep it fresh

Suggest the merge captain types this in their merge chat, so it runs every 2 minutes:

> `/loop 2m /merge-captain refresh the screen`

Every 2 minutes is quick enough, because shares merge themselves. If usage is tight, they can switch that chat to a lighter model (`/model sonnet`).

Each time:

```bash
git fetch origin
curl -s -o /dev/null http://localhost:8765/ || echo "the screen's server has stopped"   # if so, start it again, as above
git -C .screen log --oneline HEAD..origin/main     # what's new since the screen last updated
git -C .screen checkout --detach origin/main
```

- If anything new arrived, say whose it is in one line ("Faye's new colours are in") and ask them to **hard-refresh** the screen: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows).
- Check `NOTICES.md` for anything new.
- If nothing changed, say nothing, or one short line.

## Who's on what

When asked "who's on what?" (and on each refresh, but only mention problems):

```bash
git fetch origin
gh pr list --state open --json number,title,author,headRefName
git for-each-ref --format='%(refname:lstrip=3)' refs/remotes/origin   # skip HEAD and main
git diff --name-only origin/main...origin/<branch>        # for each branch with new commits
```

Show a short table: person, what they're doing (from their commit messages), files changed. **Flag overlaps:** two people changing the same file. Suggest an order ("Jim's change goes first, then Faye gets the latest before carrying on"), or that they pair. People who haven't shared yet won't show up, so ask the room too.

## Clashes

If someone's share stopped on a clash, help them resolve it (see `/share`, "Clashes"). If two changes really pull in different directions, that's a product decision: bring in the product owner.

## Merging by hand

If a pull request didn't merge itself (a clash someone has now fixed, or a "Not ready" one that now is), check it opens and works from `.screen/` or a quick look at the diff, then `gh pr merge <n> --merge`.

## At the hard stop

At 18:40, check that everyone has shared, list any open or "Not ready" pull requests, and make sure the shared screen shows the version the squad wants to show.
