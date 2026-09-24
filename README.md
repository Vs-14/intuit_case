# Autograph for Intuit Enterprise Suite: clickable prototype

## Run it
Double-click `index.html`. It opens in any modern browser (Chrome, Edge, Safari, Firefox).
No install, server or build step is needed.

It needs internet only for the two Google Fonts (Figtree and Mrs Saint Delafield).
Offline, it falls back to system fonts and still works.

"Ask Autograph" gives scripted demo answers when run locally. Live Claude answers
only work inside the published Claude artifact.

## Edit it
The source is split in `src/`:

- `styles.css`: design tokens, light and dark themes, every component, responsive rules
- `data.js`: all fictional content (company, proposals, agents, experts, exchange listings, developer journey, demo guide)
- `views.js`: one function per screen, modal and drawer; each returns HTML from the current state
- `app.js`: state, rendering, click handling, animated flows, Ask Autograph, theme, startup
- `build.py`: combines everything into one `index.html`

After editing, run `python3 src/build.py` from this folder to rebuild `index.html`.
Load order matters: data, then views, then app.

## Host it elsewhere
`index.html` is fully self-contained, so you can upload it as-is to GitHub Pages,
Netlify Drop or Vercel to get a public link.

All companies, people and numbers are fictional. Prototype by Vaasav Srivastava, XLRI Jamshedpur.
