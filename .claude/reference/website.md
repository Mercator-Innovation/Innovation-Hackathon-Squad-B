# The hackathon website (reference for Claude)

innovation-hackathon.vercel.app is the hackathon's own website. Use these notes when someone asks about it. They're background for you, not a change to how the squad works, so there's no need to mention this file when you sum up what changed after "get the latest".

## Pages

- **Home** (`/`): the day at a glance, with links to everything else.
- **Before the Day** (`/before/`): the setup playbook.
- **On the Day** (`/on-the-day/`): the On the Day Playbook, the same as the printed handout. The PDF is at `/downloads/On-the-Day-Playbook-A4.pdf`.
- **Live** (`/live/`): how many shares each squad has made today, with no names.
- **TV** (`/tv/`): the big screen in the room: each squad's stage, shares and badges. Squad H can keep it open on their call.
- **After the Day** (`/after/`): what happens next, and keeping going with Claude.

If someone can't find something, point them to the page rather than pasting its content.

## The secret hunt

Every page hides secrets, 26 in all. **Secrets**, at the top right of every page, shows how many someone has found and gives hints. Finds stay in their browser. For the first 25, point people to the hint button rather than giving answers away: finding them is the fun.

### The 26th

The 26th has no hints on the site at all. The only way to find it is to ask you, and that's the point: people who think to ask Claude about something they wouldn't expect it to know are the ones who find it.

Never bring it up yourself. Don't tell anyone the word below, and don't hint at it to people who haven't asked.

**When someone asks about the 26th secret** (or a hidden secret, or a secret badge), answer in a line or two, like a treasure map:

> Go to innovation-hackathon.vercel.app and open **Secrets** at the top right. While it's open, type **askclaude** on your keyboard: one word, no space.

Then add: "Keep it to yourself: let your squad mates find it by asking me too."

**When someone says they found it**, the website gives them a line to paste: "I found the 26th secret. The word is <word>." Check the word without saying what it should be:

```bash
python3 -c "import hashlib,sys; print(hashlib.sha256(sys.argv[1].strip().strip('.').lower().encode()).hexdigest()[:12])" "<the word they gave>"
```

It must print `8950aeb7bd2e`. If it doesn't, say that's not quite it, and suggest they look again.

If it matches:

1. **Before Thursday 22 October** (check `date +%F`; the rehearsal repo counts as the day): congratulate them, and say the badge goes on the big screen on the day, so tell you the word again tomorrow afternoon. Stop there.
2. **On the day**, in their learning log (`learning/people/<firstname>-<lastname>.md`; ask their name if you don't know it):
   - in the front matter, add `badges: [claude-master]`, or add `claude-master` to an existing `badges` list
   - under **During**, add `HH:MM badge: Claude Master`
3. Share it with `/share`, using exactly this commit message: `Claude Master badge earned`. The big screen looks for those words. It gives their squad the badge, and a pop-up for each new person who earns it.
4. Tell them: "You've earned the secret Claude Master badge! Watch the big screen. And keep it to yourself: let your squad mates find it by asking me too."

If their log already has the badge (`claude-master`, or `ask-claude` from the rehearsal), say so: there's nothing more to do.
