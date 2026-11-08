"use client";

import { useState } from "react";

export default function CopyButton({ text, label = "Kopieer prompt" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn"
      style={{ minHeight: 44, fontSize: 15, background: done ? "var(--cream)" : undefined }}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          /* klembord geweigerd: de tekst staat er nog, selecteer handmatig */
        }
      }}
    >
      {done ? "Gekopieerd" : label}
    </button>
  );
}
