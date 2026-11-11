import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Package,
  RefreshCw,
  Zap,
} from "lucide-react";
import type { ApiMetrics, Launch } from "../types/api";
import { LaunchCard } from "./LaunchCard";

interface SourcePanelProps {
  title: string;
  subtitle: string;
  accent: "cyan" | "violet";
  launches: Launch[] | null;
  metrics: ApiMetrics | null;
  loading: boolean;
  error: string | null;
  onReload: () => void;
}
export function SourcePanel({
  title,
  subtitle,
  accent,
  launches,
  metrics,
  loading,
  error,
  onReload,
}: SourcePanelProps) {
  const color = accent === "cyan" ? "text-cyan-300" : "text-violet-300";
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${accent === "cyan" ? "bg-cyan-400" : "bg-violet-400"}`}
            />
            <span className={`text-xs font-semibold tracking-[.18em] ${color}`}>
              {title}
            </span>
          </div>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <button
          onClick={onReload}
          className="button-secondary"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
          Actualizar
        </button>
      </div>
      <div className="panel grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="eyebrow">
            <Clock3 size={12} /> LATENCIA
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {metrics ? `${metrics.latency} ms` : "—"}
          </p>
        </div>
        <div>
          <p className="eyebrow">
            <Package size={12} /> CARGA
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {metrics ? `${metrics.payload} KB` : "—"}
          </p>
        </div>
        <div>
          <p className="eyebrow">
            <Zap size={12} /> CAMPOS
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {accent === "cyan" ? "6 seleccionados" : "Respuesta completa"}
          </p>
        </div>
        <div>
          <p className="eyebrow">
            <CheckCircle2 size={12} /> ESTADO
          </p>
          <p
            className={`mt-2 text-sm font-medium ${error ? "text-rose-300" : "text-emerald-300"}`}
          >
            {error ? "No disponible" : metrics ? "Operativa" : "Conectando"}
          </p>
        </div>
      </div>
      {error ? (
        <div className="panel flex items-start gap-3 border-rose-400/20">
          <AlertCircle className="mt-0.5 shrink-0 text-rose-300" size={18} />
          <div>
            <p className="text-sm font-medium text-rose-200">
              No se pudo consultar la API
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.03]"
                />
              ))
            : launches?.map((launch) => (
                <LaunchCard key={launch.id} launch={launch} />
              ))}
        </div>
      )}
    </section>
  );
}
