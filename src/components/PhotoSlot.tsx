"use client";

import { Upload, X } from "lucide-react";
import { useRef } from "react";

export function PhotoSlot({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="relative aspect-square rounded-xl border border-border bg-panel">
      {value ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="h-full w-full rounded-xl object-cover" />
          <button
            onClick={() => onChange(null)}
            aria-label="Remove photo"
            className="absolute right-2 top-2 rounded-full bg-bg/80 p-1.5 hover:bg-bg"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="absolute bottom-2 left-2 rounded bg-bg/80 px-2 py-0.5 text-xs">{label}</span>
        </>
      ) : (
        <button
          onClick={() => input.current?.click()}
          className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl text-muted hover:text-fg"
        >
          <Upload className="h-6 w-6" />
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs">Tap to upload</span>
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
