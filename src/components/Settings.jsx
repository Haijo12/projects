import { useRef, useState } from "react";
import ConfirmDialog from "./Dialog.jsx";
import Toast from "./Toast.jsx";
import { BackIcon, ChevronDownIcon, ChevronRightIcon } from "./icons.jsx";
import { Download, Upload, Trash2, X, ArrowRight } from "lucide-react";
import { downloadJsonBackup, downloadTextFile, parseImportFile, mergeImportedNotes } from "../storage/importExport.js";
import { buildMarkdownBundle } from "../storage/backup.js";
import { clearAllData } from "../storage/notesStore.js";

const SYNTAX_REFERENCE = [
  ["# Heading", "Heading (up to ###)"],
  ["**bold**", "Bold text"],
  ["_italic_", "Italic text"],
  ["~~strike~~", "Strikethrough"],
  ["==highlight==", "Highlight"],
  ["`code`", "Inline code"],
  ["```js … ```", "Code block with language"],
  ["- item", "Bullet list"],
  ["1. item", "Numbered list"],
  ["[x] done / [ ] todo", "Task"],
  ["> quote", "Blockquote"],
  ["---", "Divider"],
  ["!info text", "Info callout (also !warning !success !note)"],
  ["@tag", "Tag"],
  ["[[Note]]", "Link to another note"],
  ["[Google](https://google.com)", "External link"],
];

export default function Settings({ settings, onSettingsChange, onBack, onOpenTrash }) {
  const [toast, setToast] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [showSyntax, setShowSyntax] = useState(false);
  const fileInputRef = useRef(null);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const { notes, invalid } = parseImportFile(text, file.name);
      if (notes.length === 0 && invalid > 0) {
        flash(`Import failed: invalid file`);
        return;
      }
      const { imported, skipped } = mergeImportedNotes(notes);
      flash(
        imported + skipped > 0
          ? `Imported ${imported} note${imported === 1 ? "" : "s"}${skipped ? `, skipped ${skipped}` : ""}${invalid ? `, ${invalid} invalid` : ""}`
          : "Nothing to import"
      );
    };
    reader.readAsText(file);
  }

  function handleExportBundle() {
    downloadTextFile(buildMarkdownBundle(), "notes-bundle.md", "text/markdown");
    flash("Markdown bundle exported");
  }

  return (
    <div className="screen">
      <header className="sticky-header safe-top">
        <div className="app-header">            <button type="button" className="icon-btn" aria-label="Back" onClick={onBack}>
              <BackIcon />
            </button>
          <h1>Settings</h1>
          <span style={{ width: 44 }} />
        </div>
      </header>

      <div className="settings-list" style={{ overflowY: "auto" }}>
        {/* Appearance */}
        <section>
          <div className="settings-group-title">Appearance</div>
          <div className="settings-group">
            <div className="setting-row">
              <span className="row-label">Theme</span>
              <div className="segmented" role="group" aria-label="Theme">
                {["light", "dark", "system"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={settings.theme === t}
                    onClick={() => onSettingsChange({ theme: t })}
                  >
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-row">
              <span className="row-label">Accent</span>
              <div className="accent-row" style={{ padding: 0 }}>
                {["violet", "blue", "green", "pink", "orange"].map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={`accent-swatch ${a}`}
                    aria-pressed={settings.accent === a}
                    aria-label={`${a} accent`}
                    onClick={() => onSettingsChange({ accent: a })}
                  />
                ))}
              </div>
            </div>
            <div className="setting-row">
              <span className="row-label">Text size</span>
              <div className="segmented" role="group" aria-label="Text size">
                {["small", "medium", "large"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={settings.fontSize === s}
                    onClick={() => onSettingsChange({ fontSize: s })}
                  >
                    {s[0].toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <SettingToggle
              label="Compact note list"
              checked={settings.compactList}
              onChange={(v) => onSettingsChange({ compactList: v })}
            />
          </div>
        </section>

        {/* Editor */}
        <section>
          <div className="settings-group-title">Editor</div>
          <div className="settings-group">
            <SettingToggle
              label="Autosave"
              desc="Save automatically while typing"
              checked={settings.autosave}
              onChange={(v) => onSettingsChange({ autosave: v })}
            />
            <SettingToggle
              label="Word count"
              checked={settings.wordCount}
              onChange={(v) => onSettingsChange({ wordCount: v })}
            />
            <SettingToggle
              label="Character count"
              checked={settings.charCount}
              onChange={(v) => onSettingsChange({ charCount: v })}
            />
            <SettingToggle
              label="Quick toolbar"
              desc="Formatting buttons above the keyboard"
              checked={settings.showToolbar}
              onChange={(v) => onSettingsChange({ showToolbar: v })}
            />
            <div className="setting-row">
              <span className="row-label">Default mode</span>
              <div className="segmented" role="group" aria-label="Default mode">
                {["edit", "preview"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={settings.defaultMode === m}
                    onClick={() => onSettingsChange({ defaultMode: m })}
                  >
                    {m[0].toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Markup */}
        <section>
          <div className="settings-group-title">Markup</div>
          <div className="settings-group">
            <SettingToggle
              label="Callouts"
              desc="!info !warning !success !note"
              checked={settings.enableCallouts}
              onChange={(v) => onSettingsChange({ enableCallouts: v })}
            />
            <SettingToggle
              label="Highlights"
              desc="==text=="
              checked={settings.enableHighlights}
              onChange={(v) => onSettingsChange({ enableHighlights: v })}
            />
            <SettingToggle
              label="Note links"
              desc="[[Note title]]"
              checked={settings.enableWikilinks}
              onChange={(v) => onSettingsChange({ enableWikilinks: v })}
            />
            <button
              type="button"
              className="setting-row"
              onClick={() => setShowSyntax((v) => !v)}
            >
              <span className="row-label">Syntax reference</span>
              <span className="row-value">{showSyntax ? <ChevronDownIcon /> : <ChevronRightIcon />}</span>
            </button>
            {showSyntax && (
              <div style={{ padding: "12px 16px 16px", display: "grid", gap: 8 }}>
                {SYNTAX_REFERENCE.map(([syntax, meaning]) => (
                  <div key={syntax} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>{syntax}</code>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-2)", textAlign: "right" }}>{meaning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Data */}
        <section>
          <div className="settings-group-title">Data</div>
          <div className="settings-group">
            <button type="button" className="setting-row" onClick={() => { downloadJsonBackup(); flash("Backup exported"); }}>
              <span className="row-label">Export all notes (JSON)</span>
              <span className="row-value"><Download size={18} /></span>
            </button>
            <button type="button" className="setting-row" onClick={handleExportBundle}>
              <span className="row-label">Export markdown bundle</span>
              <span className="row-value"><Download size={18} /></span>
            </button>
            <button type="button" className="setting-row" onClick={() => fileInputRef.current?.click()}>
              <span className="row-label">Import notes</span>
              <span className="row-value"><Upload size={18} /></span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.md,.markdown,.txt"
              style={{ display: "none" }}
              onChange={handleImportFile}
            />
            <button type="button" className="setting-row" onClick={onOpenTrash}>
              <span className="row-label">Trash</span>
              <span className="row-value"><ArrowRight size={18} /></span>
            </button>
            <button type="button" className="setting-row" onClick={() => setConfirmClear(true)}>
              <span className="row-label" style={{ color: "var(--danger)" }}>Clear local data</span>
              <span className="row-value" style={{ color: "var(--danger)" }}><X size={18} /></span>
            </button>
          </div>
        </section>

        {/* Security */}
        <section>
          <div className="settings-group-title">Security</div>
          <div className="settings-group">
            <div className="setting-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
              <span className="row-label">App lock</span>
              <span className="row-desc" style={{ fontSize: "0.8rem", color: "var(--text-2)", lineHeight: 1.5 }}>
                A PIN lock is planned. Note: a web app cannot provide the same security
                guarantees as a native encrypted vault — anyone with device access may read
                browser storage.
              </span>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <div className="settings-group-title">About</div>
          <div className="settings-group">
            <div className="setting-row">
              <span className="row-label">Version</span>
              <span className="row-value">1.0.0</span>
            </div>
            <div className="setting-row">
              <span className="row-label">Storage</span>
              <span className="row-value">Local only — nothing leaves this device</span>
            </div>
            <div className="setting-row">
              <span className="row-label">License</span>
              <span className="row-value">MIT</span>
            </div>
          </div>
        </section>
      </div>

      <Toast message={toast} />

      <ConfirmDialog
        open={confirmClear}
        title="Clear all local data?"
        message="All notes and settings on this device will be permanently deleted. Export a backup first!"
        confirmLabel="Delete everything"
        danger
        onConfirm={() => {
          clearAllData();
          setConfirmClear(false);
          window.location.reload();
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}

function SettingToggle({ label, desc, checked, onChange }) {
  return (
    <button
      type="button"
      className="setting-row"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span>
        <span className="row-label" style={{ display: "block" }}>{label}</span>
        {desc && <span className="row-desc">{desc}</span>}
      </span>
      <span className={`switch${checked ? " checked" : ""}`} aria-hidden="true" />
    </button>
  );
}
