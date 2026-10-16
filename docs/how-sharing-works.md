# How sharing works

You don't need to know git: Claude does it. This is what's going on underneath.

- **GitHub** holds the squad's shared copy, called `main`. The shared screen shows it.
- **Your own copy** is on your laptop, on your own branch (`<yourname>/work`), so nobody gets in anyone's way.
- **Tell Claude `share my work`** (or `/share`): it saves your changes, brings in everyone else's latest work, checks it still works, sends it to GitHub and adds it to `main`. If nothing clashes, it goes straight in, and the merge captain refreshes the shared screen.
- **A clash** is when two people changed the same lines. Claude shows you both versions and suggests how to combine them, or asks you to have a quick word with the other person or the merge captain.
- **Tell Claude `get the latest`**: it brings everyone else's shared work into your copy.

**Share small and often:** whenever something works, and at least every 20 to 30 minutes. Small shares rarely clash.

Some things Claude will never do: push straight to `main`, overwrite other people's work, or commit passwords or real personal data.
