import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Camera, Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: scans }] = await Promise.all([
    supabase.from("profiles").select("scan_credits, email").eq("id", user.id).single(),
    supabase
      .from("scans")
      .select("id, brand, model, colorway, condition_grade, price_recommended, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your scans</h1>
          <p className="mt-1 text-muted">
            {profile?.scan_credits ?? 0} credits left · {profile?.email}
          </p>
        </div>
        <Link
          href="/scan"
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 font-medium text-bg hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New scan
        </Link>
      </header>

      {!scans || scans.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-panel py-16 text-center">
          <Camera className="h-8 w-8 text-muted" />
          <div className="font-medium">No scans yet</div>
          <p className="max-w-sm text-sm text-muted">
            Upload four photos of a pair and get back live pricing and condition in under a minute.
          </p>
          <Link href="/scan" className="mt-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-bg">
            Start your first scan
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-panel">
          {scans.map((s) => (
            <li key={s.id}>
              <Link href={`/results/${s.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-bg/40">
                <div>
                  <div className="font-medium">
                    {s.brand || s.model ? `${s.brand ?? ""} ${s.model ?? ""}`.trim() : "Unidentified scan"}
                  </div>
                  <div className="text-xs text-muted">
                    {s.colorway ?? ""}
                    {s.condition_grade ? ` · ${s.condition_grade}` : ""}
                    {s.status === "failed" ? " · failed" : ""}
                    {s.status === "analyzing" ? " · analyzing" : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {s.price_recommended ? `$${Math.round(s.price_recommended).toLocaleString()}` : "—"}
                  </div>
                  <div className="text-xs text-muted">
                    {new Date(s.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
