import { useEffect, useState } from "react";

// Keeps a subtree mounted briefly after `open` flips to false so a CSS
// exit animation can play. Pure presentation — no behavior change:
//
//   const overlay = useDelayedUnmount(menuOpen, 180);
//   {overlay.mounted && (
//     <div className={`backdrop${overlay.closing ? " backdrop--out" : ""}`} ... />
//   )}
//
// The exit duration must match the CSS "--out" animation duration.
export function useDelayedUnmount(open, delay = 180) {
  // "closed" | "open" | "closing"
  const [state, setState] = useState(open ? "open" : "closed");

  useEffect(() => {
    if (open) {
      setState("open");
      return;
    }
    setState((s) => {
      if (s === "closed") return s;
      return "closing";
    });
    const t = setTimeout(() => setState("closed"), delay);
    return () => clearTimeout(t);
  }, [open, delay]);

  return { mounted: state !== "closed", closing: state === "closing" };
}
