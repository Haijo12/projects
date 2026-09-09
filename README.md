# Personal Note App

A fast, private, offline-first mobile note application.

«Open -> Write -> Autosave -> Close.» No account, no cloud, no tracking — your
notes live in your browser's local storage and nowhere else. Designed
mobile-first (Android phones primarily), installable as a PWA.

## Features

- Instant note creation — tap **+** and start typing, no dialogs
- Autosave (debounced) with draft recovery after reload/crash
- Markdown-inspired markup with a custom lightweight parser
- Edit / Preview capsule toggle (remembers your preference)
- Instant local search (titles, content, tags)
- Automatic `@tag` detection — tap a tag to filter
- Pinning and favorites (kept deliberately separate)
- Archive and Trash with restore + permanent-delete confirmation
- `[[Internal note links]]` with backlinks ("Linked from")
- Slash commands (`/bold`, `/todo`, `/codeblock`, ...)
- Quick insert toolbar (heading, bold, code, task, tag, link...)
- Light / Dark / System themes + accent colors + text size
- Export/import backups (JSON, Markdown bundle, single-note .md)
- Installable PWA — works fully offline
- Accessibility: 44px touch targets, focus states, reduced motion

Icons throughout the UI are provided by [Lucide](https://lucide.dev/) via
`lucide-react` (see `src/components/icons.jsx`).

## Installation

The repository is standardized on [Bun](https://bun.sh) (`bun.lock` is
committed; `package-lock.json` is gitignored).

```bash
bun install
bun run dev
```

## Build

```bash
bun run build     # outputs to dist/
bun run preview   # serve the production build locally
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

In **Settings -> Data**:

- **Export all notes (JSON)** — full fidelity backup, best for re-import
- **Export markdown bundle** — all notes as one `.md` file
- **Export as Markdown** — single note, from the editor's more menu
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

## Android App (Capacitor)

The same web app is packaged as an Android APK via [Capacitor](https://capacitorjs.com) — no rewrite, just a native shell loading the Vite build.

### One-time setup

```bash
bun install                 # installs @capacitor/core, cli, android
bun run build               # web build -> dist/
bunx cap sync android       # copies dist/ into the Android project
```

The Android project lives in `android/` (appId `com.haijo.notes`, app name
"Notes").

### Building the APK through GitHub Actions

The APK is built by a GitHub Actions workflow named **Android APK**
(`.github/workflows/android-apk.yml`). The artifact is the real installable
`.apk` file — it is not the source project and not a ZIP of the repository.

To build and download the APK:

1. Open the repository on GitHub.
2. Open the **Actions** tab.
3. In the left sidebar select the **Android APK** workflow.
4. Click **Run workflow** and confirm (the workflow also runs automatically
   on every push to `main`).
5. Wait for the workflow run to finish (the **Build Android APK** job).
6. Open the completed run.
7. Scroll to the **Artifacts** section.
8. Download the **`note-app-debug-apk`** artifact.
9. The artifact is the APK file `app-debug.apk` — copy it to an Android device
   and install it (enable "Install unknown apps" for your file manager if
   prompted).

The workflow does the following:

- checks out the repository
- sets up Node.js 20 and Bun, then installs dependencies (`bun install`)
- runs the web production build (`bun run build` -> `dist/`)
- syncs the Capacitor Android project (`bunx cap sync android`)
- sets up JDK 17
- builds the debug APK with Gradle (`./gradlew assembleDebug`)
- uploads the generated `.apk` as the `note-app-debug-apk` artifact

### Build the APK locally

Requires Android Studio (or the Android SDK) and JDK 17 (matching the Gradle
8.2.1 / Android Gradle Plugin 8.2.1 used by this project):

```bash
bun run android:build       # vite build + cap sync + gradle assembleDebug
```

Or open the project in Android Studio and press Run:

```bash
bun run android             # opens android/ in Android Studio
```

The debug APK lands at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

### Updating the app after web changes

```bash
bun run cap:sync            # rebuild web + sync into android/
```

then rebuild the APK (locally or via GitHub Actions). Web-only development
(`bun run dev`) is unaffected — Capacitor only wraps the production build in
`dist/`.

## Troubleshooting

- **Workflow failure** — Open the failed run under **Actions** and expand the
  failed step to read the log. Re-run with **Re-run jobs** after fixing the
  cause. Make sure you are on a branch where the workflow is allowed to run
  (it is available via **Run workflow** on any branch).
- **No `note-app-debug-apk` artifact** — The APK artifact is only produced
  when the **Build Android APK** job finishes successfully. If the job failed
  before the upload step, no artifact is created. Confirm the Gradle step
  succeeded, then download the artifact from the **Artifacts** section of a
  completed run.
- **Gradle build failure** — Confirm JDK 17 is being used (the project pins
  Gradle 8.2.1 and Android Gradle Plugin 8.2.1, both of which require JDK 17).
  Locally, ensure the Android SDK is installed and `ANDROID_HOME`/`local.properties`
  point at it. Read the failing step output — common causes are a missing SDK
  component or a stale Capacitor sync.
- **Capacitor synchronization problems** — Run `bunx cap sync android` after
  the web build (`bun run build`) so `dist/` exists. If sync reports that the
  Android platform is missing or out of date, run `bunx cap add android` or
  reinstall dependencies with `bun install` before syncing.

## GitHub Pages

The Vite `base` is configurable for GitHub Pages: set the `GITHUB_PAGES`
environment variable in your own Pages workflow and the `repo` constant in
`vite.config.js` to match your repository name. No Pages deployment workflow
is currently committed to this repository; only the APK workflow above is
provided.

## Project Structure

```text
src/
├── main.jsx          # entry, service worker registration
├── App.jsx           # routing (hash + history), global state wiring
├── components/       # HomeScreen, Editor, Viewer, NoteCard, Settings, ...
├── parser/           # tokenizer -> parser -> AST -> React renderer
├── storage/          # notesStore (localStorage), settings, import/export
├── hooks/            # useNotes, useTheme, useDebounce, useStorage
├── utils/            # format, search, tags, links, validation
└── styles/           # CSS variables, global, mobile, components
android/             # Capacitor Android shell (APK builds)
capacitor.config.ts  # appId, appName, webDir: dist
```

The parser is fully separated from rendering (AST in, React out), and all
storage goes through `notesStore.js`, so migrating to IndexedDB later won't
touch the UI.

## License

MIT
