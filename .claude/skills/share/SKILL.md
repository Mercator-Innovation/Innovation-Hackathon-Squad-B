---
name: share
description: Save someone's work and put it into the squad's shared copy (main), so it shows on the shared screen. Commits, brings in the latest main, pushes, opens a pull request and merges it straight away if it's clean; handles clashes. Also "get the latest". Use when someone says "share", "save and share", "push", "get the latest" or "update my files", or when a change works and it's time to share it.
---

# Share

You do all the git. Say what you did in one plain sentence. Background for people is in `docs/how-sharing-works.md`.

## Rules

- **Never** commit to `main` directly, force-push, rebase, run `git reset --hard` or `git clean`, or delete anyone else's branch.
- Never commit secrets, `.env` files or real personal data. Check `git diff --staged` before every commit, and stop if you see a key, a password, a list of email addresses or a real person's details.
- Ask before anything you can't easily undo.

## Their branch

Everyone works on one branch for the day: `<firstname>-<lastname>/work` (lowercase, hyphens), so two people with the same first name don't share one. If they're on `main` or another branch:

```bash
git status                         # uncommitted changes? keep them: switching carries them along
git fetch origin
git switch <firstname>-<lastname>/work 2>/dev/null || git switch -c <firstname>-<lastname>/work origin/main
```

## Share ("share my work")

1. **Commit:**
   ```bash
   git add <the files they changed>     # named files, not git add -A
   git diff --staged --stat
   git commit -m "<what changed, in plain words>"
   ```
   Include their learning log and any new photos in `sketches/`.
2. **Bring in the latest:** `git fetch origin && git merge origin/main`.
   - **Conflict?** Go to "Clashes" below. Don't push yet.
3. **Check it still works.** Open the page (or run the tests if there are any). If it's broken, fix it with them first.
4. **Push and open a pull request:**
   ```bash
   git push -u origin <firstname>-<lastname>/work
   gh pr list --head <firstname>-<lastname>/work --state open      # reuse an open one if there is one
   gh pr create --fill --base main                      # otherwise make one
   ```
5. **Merge it if it's clean:**
   ```bash
   gh pr view --json mergeable -q .mergeable            # MERGEABLE means clean
   gh pr merge --merge
   ```
   If it says CONFLICTING, someone merged in the meantime: go back to step 2. If it's UNKNOWN, wait a few seconds and check again.
6. **No `gh`, or it isn't signed in?** Push, then give them the "Create a pull request" link that git prints, and say which buttons to press (Create pull request, then Merge pull request). `/start-here` can install `gh`.
7. **Tell them** in one line: "Shared: your <thing> is in the squad's copy." If they're in the room, suggest they tell the merge captain so the shared screen gets refreshed (the merge captain's session usually spots it anyway).

Their branch stays: they carry on working on it and share again whenever something else works. Suggest sharing **small and often**, at least every 20 to 30 minutes.

## Get the latest ("get the latest", "update my files")

If they have uncommitted changes, commit them first (a save on their own branch; it isn't shared until they say so). Then:

```bash
git fetch origin
git merge origin/main          # into their branch
```

Then check `NOTICES.md` and mention anything new in one line, and say in a line what's new from others (`git log --oneline HEAD@{1}..HEAD` or the merge summary).

## Clashes

A clash means two people changed the same lines.

1. Say which file and whose change it clashes with, in plain English.
2. Show both versions side by side, briefly.
3. If it's obvious (both changes can live together), propose the combined version and **ask before resolving**.
4. If it's not obvious, or it's someone else's slice, suggest a quick word with that person or the merge captain, and wait.
5. After resolving: commit, then carry on from step 3 of "Share".

## At the hard stop (18:40)

Help everyone share what they have, even unfinished. If it would break `main`, push it and open the pull request without merging it, titled "Not ready: <what>" with a one-line note on what's left (try `--draft` first; it isn't available on every GitHub plan). An unfinished branch with a note is fine; lost work isn't.

## Before the day

`/start-here` uses this to share each person's learning log. That proves the whole loop works before the day.
