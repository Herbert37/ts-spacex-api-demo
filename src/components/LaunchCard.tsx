import { CalendarDays, ExternalLink, Gauge, Rocket } from "lucide-react";
import type { Launch } from "../types/api";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
export function LaunchCard({ launch }: { launch: Launch }) {
  const status =
    launch.status === "upcoming"
      ? { label: "PRÓXIMO", className: "text-cyan-300 bg-cyan-400/10" }
      : launch.status === "success"
        ? { label: "EXITOSO", className: "text-emerald-300 bg-emerald-400/10" }
        : { label: "MISIÓN", className: "text-slate-300 bg-white/10" };
  return (
    <article className="group overflow-hidden rounded-xl border border-white/[0.08] bg-[#101827] transition hover:-translate-y-0.5 hover:border-cyan-300/30">
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="grid h-full place-items-center text-cyan-300/70">
          <Rocket size={52} strokeWidth={1.2} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#101827] to-transparent" />
        <span
          className={`absolute left-4 top-4 rounded-md px-2 py-1 text-[10px] font-semibold tracking-wider ${status.className}`}
        >
          {status.label}
        </span>
        <span className="absolute bottom-3 left-4 text-xs text-slate-400">
          {launch.id.slice(0, 12)}…
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium text-white">{launch.name}</h3>
          {launch.webcast && (
            <a
              href={launch.webcast}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-cyan-300"
              aria-label="Ver webcast"
            >
              <ExternalLink size={15} />
            </a>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <span className="flex items-center gap-2 text-slate-400">
            <CalendarDays size={14} className="text-cyan-400" />
            {dateFormatter.format(new Date(launch.date))}
          </span>
          <span className="flex items-center gap-2 text-slate-400">
            <Rocket size={14} className="text-violet-400" />
            {launch.rocket}
          </span>
          <span className="col-span-2 flex items-center gap-2 text-slate-400">
            <Gauge size={14} className="text-amber-400" />
            {launch.customer}
          </span>
        </div>
        {launch.details && (
          <p className="mt-4 line-clamp-2 text-xs leading-5 text-slate-500">
            {launch.details}
          </p>
        )}
      </div>
    </article>
  );
}
