# Mercator Innovation Hackathon 2026: squad repo

Your squad's shared space for the hackathon. Claude reads it every time you start a chat here, so it already knows the challenges, the day and your squad.

**When:** Thursday 22 October 2026, 15:00 to 19:00. Building stops at 18:40.
**What:** pick one of three real Scottish public sector challenges, talk it through, get a first version on the shared screen, then everyone builds.
**Help:** your squad's Teams channel, a facilitator, or the drop-ins (Mon 19 Oct 16:00 to 16:30, Tue 20 Oct 12:00 to 12:30).

## Set up (before the day, about 20 minutes)

1. **Accept your Claude invite.** Sign in with your Mercator email. Claude emails you a link, not a code. If you use Claude personally, sign out of that account first.
2. **Install Claude Desktop** from claude.ai/download. On a Mercator laptop, open the **Self Service** app and turn on **Admin On-demand** first.
3. **Get into GitHub.** Accept the invite GitHub emails you (or make a free account with your Mercator email if we've asked you to). Turn on two-factor sign-in.
4. **Make a Hackathon folder.** In Claude Desktop, open the **Code** tab. Click **+** under the chat box, then **Add folder**. Go to **Documents**, click **New Folder**, name it `Hackathon` and select it.
5. **Clone your squad's repo.** Paste this line from your setup email into the chat box and press Enter. Claude runs it for you; you don't need a terminal:
   `Run this in this folder: git clone https://github.com/Mercator-Innovation/Innovation-Hackathon-Squad-A.git .`
   The full stop at the end matters: it puts the squad's files straight into your Hackathon folder, not a subfolder. When Claude asks for access, allow the Hackathon folder. If Claude says the folder isn't empty (often a hidden file), ask it to clone into a temporary folder and move everything up, including the hidden `.git` folder, or start again with a new, empty folder.
6. **Link GitHub.** If Claude asks you to sign in to GitHub, click the **play icon** to run the command. In the terminal that opens on the right, type `Y` and press Enter. Sign in in the browser, copy the one-time code back, and approve. These prompts are safe.
7. **Start a new chat in the Hackathon folder.** This step matters: the squad's skills only load in a chat that starts after the files are there.
   - In the left sidebar, click **+** next to **Hackathon** to start a new chat in that folder.
   - Type `/`. You should see **start-here** in the list.
   - If you don't, Claude may have made a subfolder after all. Click the folder name above the chat box, choose **Change folder**, and open the folder inside Hackathon that has `README.md` and `TEAM.md` in it.
8. **Type `/start-here`.** Claude checks your setup, finds you in `TEAM.md`, asks three quick questions (just click your answers) and shares your learning log. That proves everything works.
9. **Post "I'm set up"** in your squad's Teams channel.

Stuck? Bring it to a drop-in, or ask in your Teams channel. That's what they're for.

## The squad lead's job (before the day)

The organisers have named a **squad lead** in `TEAM.md`. They:

- agree the squad's two roles in the Teams channel by **Wed 21 Oct**: a **product owner** and a **merge captain** (see `TEAM.md`), then tell Claude `add our roles to TEAM.md`
- make sure everyone has posted "I'm set up"

Everyone else: chat in the Teams channel, say which role you'd enjoy, and help the squad lead.

**Fine before the day:** setting up, agreeing roles, reading the challenges in `challenges/` and asking Claude about them.
**Save for the day:** choosing the challenge, the squad name and the idea, and any building. That way every squad starts from the same point.

## On the day

| Time | What |
|---|---|
| 15:00 | Welcome |
| 15:10 | **Pick a challenge**, together at one screen |
| 15:30 | **Talk it through**: who's struggling, when, and what would help |
| 15:50 | **First version**: the merge captain describes it to Claude, and it's on the shared screen by about 16:10 |
| 16:10 | **Grab and build**: everyone picks something to improve and builds it (food arrives at around 17:00: eat while you work) |
| 17:15 | **Look together** (10 min): what matters most next? |
| 17:25 | **Grab and build** again |
| **18:40** | **Hard stop**, then show and tell: 2 minutes a squad |
| 19:00 | Reflection and wrap-up: squads reflect while the facilitators explain what happens next |

The timings are a guide. More in `docs/the-day.md`.

## What to tell Claude

Type these into the Claude chat.

| Tell Claude | What happens |
|---|---|
| `/start-here` (or `what now?`) | Checks your setup and tells you where the squad is |
| `/challenges` | The three challenges, explained the same way for every squad, plus your questions |
| `/find-out` + anything | Research on demand: policy, users, data, design patterns, how others solved it |
| `/first-version` | For the driver: turns the squad's idea into a working first version |
| `/share` (or `share my work`) | Saves your work and puts it on the shared screen |
| `get the latest` | Brings everyone else's work into your copy |
| `/merge-captain` | For the merge captain: the shared screen, who's changing what, and clashes |
| `/reflect` | Notes a moment worth remembering, or your end-of-day reflection |
| `/show-and-tell` | The 2-minute outline |

You don't need the slash: plain English works too.

## Tips

- **Tab then Enter** accepts the prompt Claude suggests in grey.
- You can **type while Claude is working**.
- **Shared pages** (like a Discovery Wall) open on the right. Any shared with you are in the **Artifacts** list at the top of the left sidebar. To share one, click **Share**, then **Copy link** and post it in your Teams channel.
- Prefer paper or a whiteboard? Go for it. Photograph it into `sketches/` and tell Claude `share my work`.
- Long chat getting muddled? Start a new chat in the same folder.

## Ground rules

- **Everyone builds.** You don't need to be a developer to build, or a designer to design.
- **No real personal data, client data or secrets.** Use synthetic or open data.
- Only run Claude in this repo folder, and read what it asks to run before you approve it.
- Show and tell is 2 minutes: what you built, one thing that didn't work and one surprise from the tooling. There's no judging.
- Food arrives at around 17:00, and you're welcome to eat while you work with your squad. It's a dry event.
