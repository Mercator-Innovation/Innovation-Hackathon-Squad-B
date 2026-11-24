# Simon's script: Challenges and learnings (4:30 to 6:45)

*Draft for Simon to review. About 2 minutes 15 at a steady pace.*

---

Thanks Okeli.

This is a mix of what we noticed on the day and what came up in our reflections afterwards.

**What got in our way**

We kept hitting merge conflicts in the code. We'd each taken a separate feature. But every feature still touched the same shared files: the stylesheet, the main HTML page and one big content file.

The fix is a more modular codebase, where each feature lives in its own module with its own styles and content. We could have asked Claude to set that up in the first version. Then each of us and each of our Claude instances could have worked in parallel without stepping on each other.

We also built so fast that we didn't spend enough time using the site ourselves. More time clicking through it as people would have improved the UI.

**What surprised us**

Half joking, Petra told Claude to act as the best designer, developer and BA around and improve everything. It took her seriously and found 50 issues from five expert angles. Giving Claude specific roles really does make it look harder.

For our Cases feature three Claude agents reviewed code another Claude had written and found 27 real problems. Next time I'd build that in from the start. Some agents build and others review. We could even add agents for design and accessibility.

**What we took away**

Most of us were surprised by how fast Claude could build. That moved the hard part somewhere else. Writing the code was quick. Working together on one codebase was where we lost time. So for me the things to get better at are teamwork, version control and planning early.

The challenges were interesting and it was good to work on real problems. Next time I'd like something more technically demanding with real open datasets. Without proper data we were mostly building a website on top of assumptions and mock data.

And with that, over to Helen!

---

## Notes

- **Overlap with Okeli:** the merge conflicts are also in Okeli's section ("The hard parts"). If you keep them here, ask Okeli to drop them from his.
- **Backing for the clashes point:** on the day, all five of us changed `styles.css`, `index.html`, `content.js` and `app.js`.
