"use client";

import { useState } from "react";

type SourcesToggleProps = {
  sources: string[];
};

export default function SourcesToggle({ sources }: SourcesToggleProps) {
  const [open, setOpen] = useState(false);

  if (!sources.length) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-line pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm text-muted underline underline-offset-4"
      >
        מקורות
      </button>
      {open ? (
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {sources.map((source) => (
            <li key={source} className="break-all">
              <a href={source} target="_blank" rel="noreferrer">
                {source}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
