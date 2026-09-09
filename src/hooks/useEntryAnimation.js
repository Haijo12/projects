import { useEffect, useState } from "react";

// True for a short window after mount — used to run a one-shot staggered
// list entrance, then permanently disabled so later updates (search typing,
// reorders) never re-trigger animations.
export function useEntryAnimation(duration = 700) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setActive(false), duration);
    return () => clearTimeout(t);
  }, [duration]);

  return active;
}
