"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PhotoSlot } from "@/components/PhotoSlot";
import { Loader2 } from "lucide-react";

type Slot = "left" | "right" | "top" | "sole";

export default function ScanPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Record<Slot, string | null>>({
    left: null,
    right: null,
    top: null,
    sole: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allReady = Object.values(photos).every((p) => p !== null);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(photos),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Scan failed");
      const { id } = await res.json();
      router.push(`/results/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Scan your shoe</h1>
      <p className="mt-2 text-muted">Upload clear photos of all four angles. Good lighting and a neutral background get the most accurate grade.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <PhotoSlot label="Left side" value={photos.left} onChange={(v) => setPhotos((p) => ({ ...p, left: v }))} />
        <PhotoSlot label="Right side" value={photos.right} onChange={(v) => setPhotos((p) => ({ ...p, right: v }))} />
        <PhotoSlot label="Top-down" value={photos.top} onChange={(v) => setPhotos((p) => ({ ...p, top: v }))} />
        <PhotoSlot label="Sole" value={photos.sole} onChange={(v) => setPhotos((p) => ({ ...p, sole: v }))} />
      </div>

      {error && <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

      <button
        onClick={submit}
        disabled={!allReady || submitting}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 font-medium text-bg disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</> : "Analyze & price"}
      </button>
    </main>
  );
}
