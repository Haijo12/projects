# Personal Note App

A fast, private, offline-first mobile note application.

«Open → Write → Autosave → Close.» No account, no cloud, no tracking — your
notes live in your browser's local storage and nowhere else. Designed
mobile-first (Android phones primarily), installable as a PWA.

## Features

- ⚡ Instant note creation — tap **+** and start typing, no dialogs
- 💾 Autosave (debounced) with draft recovery after reload/crash
- 📝 Markdown-inspired markup with a custom lightweight parser
- 👁 Edit / Preview capsule toggle (remembers your preference)
- 🔍 Instant local search (titles, content, tags)
- 🏷 Automatic `@tag` detection — tap a tag to filter
- 📌 Pinning and ⭐ favorites (kept deliberately separate)
- 📦 Archive and 🗑 Trash with restore + permanent-delete confirmation
- 🔗 `[[Internal note links]]` with backlinks ("Linked from")
- ⌨️ Slash commands (`/bold`, `/todo`, `/codeblock`, …)
- 🛠 Quick insert toolbar (heading, bold, code, task, tag, link…)
- 🌗 Light / Dark / System themes + accent colors + text size
- 📤 Export/import backups (JSON, Markdown bundle, single-note .md)
- 📱 Installable PWA — works fully offline
- ♿ Accessibility: 44px touch targets, focus states, reduced motion

## Installation

```bash
npm install
npm run dev
```

## Build

```bash
npm run build     # outputs to dist/
npm run preview   # serve the production build locally
```

## Markup Syntax

Headings:

```text
# Heading 1
## Heading 2
### Heading 3
```

Text formatting:

```text
**bold**
_italic_
~~strikethrough~~
==highlight==
`inline code`
```

Code blocks (language optional, rendered with a Copy button):

````
```js
console.log("Hello");
```
````

Lists and tasks:

```text
- Item
- Another item
1. Numbered item
[x] Finished task
[ ] Unfinished task
```

Quote and divider:

```text
> This is a quote
---
```

Callouts:

```text
!info This is information.
!warning Be careful.
!success Completed successfully.
!note General note.
```

External links:

```text
[Google](https://google.com)
```

## Internal Links

Reference another note by title:

```text
[[Project Ideas]]
```

- If the note exists, the link is clickable and opens it (navigation history
  is preserved, so Android back returns to the previous note).
- If it doesn't exist, it renders as a dotted unresolved link — tap it to
  create the missing note.

## Tags

Write `@ideas`, `@school`, `@project` anywhere in a note. Tags are extracted
automatically, shown on cards and in preview, and tapping one filters the
note list.

## Tasks

```text
[x] Finished task
[ ] Unfinished task
```

Rendered as tap-friendly checkboxes in Preview (read-only).

## Backlinks

If Note A contains `[[Project Ideas]]`, the "Project Ideas" note shows:

```text
Linked from
• Note A
• Weekend Ideas
```

Computed locally — no server involved.

## Backups

In **Settings → Data**:

- **Export all notes (JSON)** — full fidelity backup, best for re-import
- **Export markdown bundle** — all notes as one `.md` file
- **Export as Markdown** — single note, from the editor's ⋮ menu
- **Import notes** — accepts JSON backups, Markdown, or plain text

Imports are validated and merged without overwriting newer existing notes;
you'll see a summary like «Imported 12 notes, skipped 1 invalid file».

## Privacy

Notes are stored locally on the device. Clearing browser/app storage can
remove them, so users should export backups regularly.

No account. No analytics. No advertising. No note content ever leaves your
device — there is no server.

## PWA

- Web manifest + app icons + service worker included
- Install from your browser menu («Add to Home Screen»)
- Launches standalone, portrait, with offline caching
- Works with no internet connection after first load

## GitHub Pages Deployment

The Vite `base` is set to the repository name in `vite.config.js` (currently
`/projects/`). If you rename the repo, update the `repo` constant.

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and deploys
`dist/` to GitHub Pages on every push to `main`. Enable Pages via
**Settings → Pages → Source: GitHub Actions**.

## Project Structure

```text
src/
├── main.jsx          # entry, service worker registration
├── App.jsx           # routing (hash + history), global state wiring
├── components/       # HomeScreen, Editor, Viewer, NoteCard, Settings, …
├── parser/           # tokenizer → parser → AST → React renderer
├── storage/          # notesStore (localStorage), settings, import/export
├── hooks/            # useNotes, useTheme, useDebounce, useStorage
├── utils/            # format, search, tags, links, validation
└── styles/           # CSS variables, global, mobile, components
```

The parser is fully separated from rendering (AST in, React out), and all
storage goes through `notesStore.js`, so migrating to IndexedDB later won't
touch the UI.

## License

MIT
