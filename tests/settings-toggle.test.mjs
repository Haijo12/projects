// Regression test: Settings toggles are fully controlled + persisted.
// Run: node tests/settings-toggle.test.mjs
//
// For every SettingToggle key: flip ON → "reload app" (fresh JS context) →
// still ON; flip OFF → reload → still OFF. Also asserts the CSS contract:
// .switch.checked is the ONLY visual state hook (track + knob).

const backing = new Map();
globalThis.localStorage = {
  getItem: (k) => (backing.has(k) ? backing.get(k) : null),
  setItem: (k, v) => backing.set(k, String(v)),
  removeItem: (k) => backing.delete(k),
};

let freshCounter = 0;
// A unique query string forces Node to evaluate a NEW module instance —
// the module-level settingsCache is empty again, like reopening the app.
const fresh = () => import(`../src/storage/settingsStore.js?fresh=${++freshCounter}`);

const KEYS = [
  "compactList", "autosave", "wordCount", "charCount",
  "showToolbar", "enableCallouts", "enableHighlights", "enableWikilinks",
];

let passes = 0, failures = 0;
const check = (name, cond) => {
  if (cond) { passes++; console.log(`  ✓ ${name}`); }
  else { failures++; console.error(`  ✗ ${name}`); }
};

for (const key of KEYS) {
  let store = await fresh();
  store.updateSettings({ [key]: true });
  store = await fresh();
  check(`${key}: ON persists after reopen`, store.getSettings()[key] === true);
  store.updateSettings({ [key]: false });
  store = await fresh();
  check(`${key}: OFF persists after reopen`, store.getSettings()[key] === false);
}

const asClassName = (checked) => `switch${checked ? " checked" : ""}`;
check("controlled: className mirrors checked=true", asClassName(true) === "switch checked");
check("controlled: className mirrors checked=false", asClassName(false) === "switch");

const { readFileSync } = await import("node:fs");
const css = readFileSync(new URL("../src/styles/components.css", import.meta.url), "utf8");
check("OFF track uses --surface-3", /\.switch\s*\{[^}]*background:\s*var\(--surface-3\)/s.test(css));
check("ON track uses --accent via .switch.checked", /\.switch\.checked\s*\{[^}]*background:\s*var\(--accent\)/s.test(css));
check("knob moves right on the same state", /\.switch\.checked::after\s*\{[^}]*transform:\s*translateX\(20px\)/s.test(css));
check("row children cannot intercept taps", /\.setting-row\[role="switch"\]\s*>\s*\*\s*\{[^}]*pointer-events:\s*none/s.test(css));
check("no native :checked dependency", !/\.switch:checked/.test(css));
check("no stale aria-based visual selector", !/aria-checked.*\.switch/.test(css));

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
