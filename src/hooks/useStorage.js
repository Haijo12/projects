import { useEffect, useState } from "react";
import { subscribe, getStorageInfo } from "../storage/notesStore.js";

// Exposes { count, bytes, error } and re-renders on storage errors
export function useStorage() {
  const [state, setState] = useState(() => getStorageInfo());
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = subscribe((event) => {
      if (event.kind === "storage-error") {
        setError(event.error);
      }
    });
    return () => unsub();
  }, []);

  return { ...state, error };
}
