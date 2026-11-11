import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: "cyan" | "violet" | "amber";
}
export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "cyan",
}: MetricCardProps) {
  const tones = {
    cyan: "text-cyan-300 bg-cyan-400/10",
    violet: "text-violet-300 bg-violet-400/10",
    amber: "text-amber-300 bg-amber-400/10",
  };
  return (
    <div className="panel flex items-start justify-between">
      <div>
        <p className="eyebrow">{label}</p>
        <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
          {value}
        </p>
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      </div>
      <span className={`rounded-lg p-2.5 ${tones[tone]}`}>
        <Icon size={18} />
      </span>
    </div>
  );
}
