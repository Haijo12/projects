import { useEffect, useState } from "react";

// Self-managing visibility: keeps the last message on screen through a short
// fade-out before unmounting, so toasts never vanish abruptly.
export default function Toast({ message }) {
  const [shown, setShown] = useState(message);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (message) {
      setShown(message);
      setClosing(false);
      return;
    }
    if (!shown) return;
    setClosing(true);
    const t = setTimeout(() => {
      setShown("");
      setClosing(false);
    }, 180);
    return () => clearTimeout(t);
    // `shown` is intentionally read from the latest render closure only when
    // `message` flips to empty, so re-renders caused by `shown` itself don't
    // restart the exit timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  if (!shown) return null;
  return (
    <div className={`toast${closing ? " toast--out" : ""}`} role="status" aria-live="polite">
      {shown}
    </div>
  );
}
