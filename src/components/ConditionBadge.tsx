import { clsx } from "clsx";

const GRADE_STYLES: Record<string, string> = {
  DS: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  VNDS: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  USED: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  BEAT: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

const GRADE_LABEL: Record<string, string> = {
  DS: "Deadstock",
  VNDS: "Very near deadstock",
  USED: "Used",
  BEAT: "Beat",
};

export function ConditionBadge({ grade, score }: { grade: string; score: number | null }) {
  const style = GRADE_STYLES[grade] ?? "bg-panel text-muted border-border";
  return (
    <div className={clsx("flex flex-col items-end rounded-lg border px-3 py-2 text-right", style)}>
      <span className="text-xs uppercase tracking-wider opacity-80">{GRADE_LABEL[grade] ?? "Unknown"}</span>
      <span className="text-2xl font-semibold leading-none">{grade}</span>
      {score !== null && score !== undefined && (
        <span className="mt-1 text-xs opacity-80">{score}/100</span>
      )}
    </div>
  );
}
