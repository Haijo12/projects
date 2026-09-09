// settingsStore — app settings persisted in localStorage

const SETTINGS_KEY = "noteapp:settings:v1";

export const DEFAULT_SETTINGS = {
  theme: "system", // light | dark | system
  accent: "orange",
  fontSize: "medium", // small | medium | large
  compactList: false,
  autosave: true,
  wordCount: false,
  charCount: false,
  showToolbar: true,
  defaultMode: "edit", // edit | preview
  enableCallouts: true,
  enableHighlights: true,
  enableWikilinks: true,
  trashRetentionDays: 30,
};

let settingsCache = null;

function load() {
  if (settingsCache) return settingsCache;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      settingsCache = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } else {
      settingsCache = { ...DEFAULT_SETTINGS };
    }
  } catch {
    settingsCache = { ...DEFAULT_SETTINGS };
  }
  return settingsCache;
}

export function getSettings() {
  return load();
}

export function updateSettings(partial) {
  const current = load();
  settingsCache = { ...current, ...partial };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsCache));
  } catch (e) {
    console.warn("Could not persist settings:", e);
  }
  return settingsCache;
}

export function resetSettings() {
  settingsCache = { ...DEFAULT_SETTINGS };
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch {
    // ignore
  }
  return settingsCache;
}
