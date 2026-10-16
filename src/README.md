# The prototype

`/first-version` builds the squad's first version here, then everyone improves it.

- Plain HTML, CSS and JavaScript that opens straight from the file: `open src/index.html` on a Mac, or double-click it. No build step and no installs, unless the squad decides otherwise.
- Data goes in `data/` as `.js` files (`window.DATA = …`), because a page opened from a file can't load `.json`. **Synthetic or open data only.**
- The files are split so people can work at the same time: `index.html` (structure), `styles.css` (the look), `app.js` (behaviour), `content.js` (the words), `data/` (data), plus one file per extra screen.
