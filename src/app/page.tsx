import Link from "next/link";
import { Camera, DollarSign, Clock, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-24 pt-16">
      <header className="mb-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent" />
          <span className="text-lg font-semibold">ShoeScanner</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-muted">
          <Link href="/scan" className="hover:text-fg">Scan</Link>
          <Link href="/dashboard" className="hover:text-fg">Dashboard</Link>
          <Link href="/login" className="rounded-md bg-fg px-3 py-1.5 text-bg hover:opacity-90">Log in</Link>
        </nav>
      </header>

      <section className="mb-20">
        <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight">
          Scan a shoe. Get the real price.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">
          Live comps from eBay, StockX, and GOAT — matched to the actual condition of your pair. See your floor, your ceiling, your net after fees, and how long it'll take to sell.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/scan" className="rounded-lg bg-accent px-5 py-3 font-medium text-bg hover:opacity-90">
            Start a scan
          </Link>
          <Link href="#how" className="rounded-lg border border-border px-5 py-3 font-medium text-fg hover:bg-panel">
            How it works
          </Link>
        </div>
      </section>

      <section id="how" className="grid gap-4 md:grid-cols-4">
        {[
          { icon: Camera, title: "4 photos", body: "Left, right, top, sole. That's it." },
          { icon: Zap, title: "AI grading", body: "DS / VNDS / USED / BEAT with flaw detection." },
          { icon: DollarSign, title: "Live comps", body: "eBay sold + StockX + GOAT, filtered to your condition." },
          { icon: Clock, title: "Time to sell", body: "Demand score and days-to-sell estimate." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-border bg-panel p-5">
            <Icon className="mb-3 h-5 w-5 text-accent" />
            <div className="font-medium">{title}</div>
            <div className="mt-1 text-sm text-muted">{body}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
