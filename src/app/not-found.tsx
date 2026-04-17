import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="mt-2 text-muted">That page doesn&apos;t exist.</p>
      <Link href="/" className="mt-6 rounded-md border border-border px-4 py-2 hover:bg-panel">
        Back home
      </Link>
    </main>
  );
}
