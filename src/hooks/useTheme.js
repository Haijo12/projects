import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../storage/settingsStore.js";

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function useTheme() {
  const [settings, setSettings] = useState(getSettings);

  // Apply theme/accent/fontsize to <html>
  useEffect(() => {
    const root = document.documentElement;
    const resolved =
      settings.theme === "system" ? (systemPrefersDark() ? "dark" : "light") : settings.theme;
    root.setAttribute("data-theme", resolved);
    root.setAttribute("data-accent", settings.accent);
    root.setAttribute("data-fontsize", settings.fontSize);
  }, [settings]);

  // Follow system changes when theme = system
  useEffect(() => {
    if (settings.theme !== "system" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      document.documentElement.setAttribute("data-theme", mq.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.theme]);

  const update = (partial) => setSettings(updateSettings(partial));

  return { settings, update };
}
