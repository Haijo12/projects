// Persistence smoke tests for the notesStore data layer.
// Run: bun run test:persistence  (or: node tests/persistence.test.mjs)
//
// Covers the exact scenarios that must never lose data:
//   create → save → "reload" (fresh module state) → note still there
//   edit → reload → edit persisted
//   trash → empty trash keeps live notes
//   corrupted storage payload → sanitized, raw kept, no crash
//   per-note drafts → one note's draft never destroys another's
//   legacy single-slot draft → migrated
//   rapid sequential saves → last write wins, none lost

let failures = 0;
let passes = 0;

function check(name, cond) {
  if (cond) {
    passes++;
    console.log(`  ✓ ${name}`);
  } else {
    failures++;
    console.error(`  ✗ ${name}`);
  }
}

// Minimal localStorage stub (node has none) — survives "reload" via the map.
const backing = new Map();
globalThis.localStorage = {
  getItem: (k) => (backing.has(k) ? backing.get(k) : null),
  setItem: (k, v) => backing.set(k, String(v)),
  removeItem: (k) => backing.delete(k),
};

const store = await import("../src/storage/notesStore.js");

function makeNote(overrides = {}) {
  const now = Date.now();
  return {
    id: `n-${Math.random().toString(36).slice(2, 10)}`,
    title: "",
    content: "",
    tags: [],
    pinned: false,
    favorite: false,
    archived: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
    metadata: {},
    ...overrides,
  };
}

// Fresh module state = what happens on app reload / Android process restart.
async function reload() {
  // Re-import with a cache-busting query so module-level caches reset.
  const fresh = await import(`../src/storage/notesStore.js?reload=${Date.now()}-${Math.random()}`);
  return fresh;
}

console.log("Persistence tests");

// --- 1. Create → reload → still there ---
{
  const id = "note-alpha";
  store.saveNote(makeNote({ id, title: "Alpha", content: "# Alpha\nBody text" }));
  const fresh = await reload();
  const loaded = fresh.getNote(id);
  check("create survives reload", loaded !== null);
  check("content survives reload", loaded?.content === "# Alpha\nBody text");
}

// --- 2. Edit → reload → edit persisted ---
{
  const fresh1 = await reload();
  const note = fresh1.getNote("note-alpha");
  fresh1.saveNote({ ...note, content: "Edited body", updatedAt: Date.now() });
  const fresh2 = await reload();
  check("edit survives reload", fresh2.getNote("note-alpha")?.content === "Edited body");
}

// --- 3. Multiple notes → reload → all present ---
{
  const fresh1 = await reload();
  for (let i = 0; i < 5; i++) {
    fresh1.saveNote(makeNote({ id: `bulk-${i}`, title: `Bulk ${i}`, content: `content ${i}` }));
  }
  const fresh2 = await reload();
  const all = fresh2.getAllNotes();
  const bulk = all.filter((n) => n.id.startsWith("bulk-"));
  check("all 5 bulk notes survive reload", bulk.length === 5);
}

// --- 4. Delete → reload → deletion persisted ---
{
  const fresh1 = await reload();
  fresh1.deleteNotePermanently("bulk-3");
  const fresh2 = await reload();
  check("permanent delete survives reload", fresh2.getNote("bulk-3") === null);
  check("siblings untouched after delete", fresh2.getNote("bulk-2") !== null);
}

// --- 5. Trash + empty trash keeps live notes ---
{
  const fresh1 = await reload();
  fresh1.saveNote(makeNote({ id: "trash-me", title: "T", deletedAt: Date.now() }));
  const before = fresh1.getAllNotes().filter((n) => n.id === "note-alpha").length;
  fresh1.emptyTrash();
  const fresh2 = await reload();
  check("trashed note removed by emptyTrash", fresh2.getNote("trash-me") === null);
  check("live note survives emptyTrash", fresh2.getNote("note-alpha") !== null && before === 1);
}

// --- 6. Corrupted payload → sanitized, raw preserved, no crash ---
{
  backing.set("noteapp:notes:v1", "{not valid json!!!");
  const fresh = await reload();
  check("corrupted JSON does not crash load", Array.isArray(fresh.getAllNotes()));
  check("raw corrupted payload is preserved for recovery", backing.has("noteapp:notes:corrupt:v1"));
  // Recover: put valid-but-sloppy data through
  backing.set(
    "noteapp:notes:v1",
    JSON.stringify([
      { title: "No id", content: 42, tags: "wrong", createdAt: "bad", extra: "kept" },
      null,
      { id: "ok-note", title: "OK" },
    ])
  );
  const fresh2 = await reload();
  const notes = fresh2.getAllNotes();
  check("sloppy array is sanitized to valid notes", notes.length === 3);
  check("missing ids are regenerated", notes.every((n) => typeof n.id === "string" && n.id));
  check("non-string content coerced to string", notes[0].content === "");
  check("unknown fields preserved (forward compat)", notes[0].extra === "kept");
}

// --- 7. Per-note drafts: one note's draft never destroys another's ---
{
  const fresh = await reload();
  fresh.saveDraft("draft-a", "alpha draft", "Alpha title");
  fresh.saveDraft("draft-b", "beta draft", null);
  check("draft A readable", fresh.loadDraft("draft-a")?.content === "alpha draft");
  check("draft B readable after saving A", fresh.loadDraft("draft-b")?.content === "beta draft");
  fresh.clearDraft("draft-a");
  check("clearing A keeps B", fresh.loadDraft("draft-b") !== null);
  check("A is gone after clear", fresh.loadDraft("draft-a") === null);
}

// --- 8. Legacy single-slot draft is migrated ---
{
  backing.set(
    "noteapp:draft:v1",
    JSON.stringify({ noteId: "legacy-note", content: "legacy content", title: "Legacy", at: Date.now() })
  );
  const fresh = await reload();
  check("legacy draft migrated to per-note store", fresh.loadDraft("legacy-note")?.content === "legacy content");
  check("legacy key removed after migration", backing.get("noteapp:draft:v1") === undefined || backing.get("noteapp:draft:v1") === null);
}

// --- 9. Rapid sequential saves: last write wins, nothing silently lost ---
{
  const fresh = await reload();
  fresh.saveNote(makeNote({ id: "rapid", title: "v0", content: "v0" }));
  for (let i = 1; i <= 50; i++) {
    fresh.saveNote(makeNote({ id: "rapid", title: `v${i}`, content: `v${i}` }));
  }
  const fresh2 = await reload();
  const note = fresh2.getNote("rapid");
  check("rapid saves: final state persisted", note?.title === "v50");
  check("rapid saves: exactly one copy", fresh2.getAllNotes().filter((n) => n.id === "rapid").length === 1);
}

// --- 10. Copy-on-write: subscribers get a NEW array reference each write ---
{
  const fresh = await reload();
  let eventCount = 0;
  const unsub = fresh.subscribe((e) => {
    if (e.kind === "notes") eventCount++;
  });
  const ref1 = fresh.getAllNotes();
  fresh.saveNote(makeNote({ id: "cow-test", title: "x" }));
  const ref2 = fresh.getAllNotes();
  check("store emits change events", eventCount === 1);
  check("reference changed after write (React re-renders)", ref1 !== ref2);
  unsub();
  fresh.saveNote(makeNote({ id: "cow-test2", title: "y" }));
  check("unsubscribe works", eventCount === 1);
}

// --- 11. Initialization never writes an empty array over real notes ---
{
  // Simulate the classic bug: module loads, code calls saveNotesBulk([]).
  backing.set("noteapp:notes:v1", JSON.stringify([makeNote({ id: "precious", title: "Keep me" })]));
  const fresh = await reload();
  fresh.saveNotesBulk([]);
  const fresh2 = await reload();
  check("bulk-saving empty list never wipes notes", fresh2.getNote("precious") !== null);
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures > 0 ? 1 : 0);
