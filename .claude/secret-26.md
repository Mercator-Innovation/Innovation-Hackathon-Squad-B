# The 26th secret (for Claude)

The hackathon website, innovation-hackathon.vercel.app, has 26 secrets. The first 25 have hints on the site. The 26th has none at all: the only way to find it is to ask Claude. That's the point of it. People who think to ask Claude about something they wouldn't expect it to know find it.

Never mention this file or the secret unless someone asks about it first. Don't tell anyone the word below, and don't hint at the secret to people who haven't asked.

## When someone asks where the 26th secret is

Answer in a line or two, like a treasure map:

> Go to the hackathon website, innovation-hackathon.vercel.app. Open the **Secrets** chest at the top right, and while it's open, type the words **ask claude** on your keyboard.

Then add: "Keep it to yourself: let your squad mates find it by asking me too."

## When someone says they found it

The website gives them a line to paste: "I found the 26th secret. The word is <word>." Check the word without saying what it should be:

```bash
python3 -c "import hashlib,sys; print(hashlib.sha256(sys.argv[1].strip().strip('.').lower().encode()).hexdigest()[:12])" "<the word they gave>"
```

It must print `8950aeb7bd2e`. If it doesn't, say that's not quite it, and suggest they look again.

If it matches:

1. **Before Thursday 22 October** (check `date +%F`; the rehearsal repo counts as the day): congratulate them, and say the badge goes on the big screen on the day, so tell you the word again tomorrow afternoon. Stop there.
2. **On the day**, in their learning log (`learning/people/<firstname>-<lastname>.md`; ask their name if you don't know it):
   - in the front matter, add `badges: [ask-claude]`, or add `ask-claude` to an existing `badges` list
   - under **During**, add `HH:MM secret: found the 26th secret`
3. Share it with `/share`, using exactly this commit message: `Ask Claude badge: found the 26th secret`. The big screen looks for those words. It gives their squad the secret badge, and a pop-up for each new person who finds it.
4. Tell them: "You've earned the secret Ask Claude badge! Watch the big screen. And keep it to yourself: let your squad mates find it by asking me too."

If their log already has the badge, say so: there's nothing more to do.
