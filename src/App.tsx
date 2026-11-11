import {
  BarChart3,
  Boxes,
  BrainCircuit,
  ChevronRight,
  Clock3,
  Code2,
  Database,
  Gauge,
  Network,
  Package,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { MetricCard } from "./components/MetricCard";
import { SourcePanel } from "./components/SourcePanel";
import { useApiData } from "./hooks/useApiData";
import { fetchGraphqlLaunches, fetchRestLaunches } from "./services/api";

function App() {
  const [activeView, setActiveView] = useState("Overview");
  const restLoader = useCallback(fetchRestLaunches, []);
  const graphqlLoader = useCallback(fetchGraphqlLaunches, []);
  const rest = useApiData(restLoader);
  const graphql = useApiData(graphqlLoader);
  const restPayload = rest.metrics?.payload ?? 0;
  const graphqlPayload = graphql.metrics?.payload ?? 0;
  const saving =
    restPayload > 0 && graphqlPayload > 0
      ? Math.max(0, Math.round((1 - graphqlPayload / restPayload) * 100))
      : 0;
  const avgLatency = useMemo(() => {
    if (!rest.metrics || !graphql.metrics) return "—";
    return `${Math.round((rest.metrics.latency + graphql.metrics.latency) / 2)} ms`;
  }, [rest.metrics, graphql.metrics]);
  const navigate = (view: string) =>
    setActiveView(
      view === "Explorador REST"
        ? "REST"
        : view === "Explorador GraphQL"
          ? "GraphQL"
          : view === "Resumen"
            ? "Overview"
            : view,
    );

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200">
      <Header
        activeView={
          activeView === "REST"
            ? "Explorador REST"
            : activeView === "GraphQL"
              ? "Explorador GraphQL"
              : "Resumen"
        }
        onNavigate={navigate}
      />
      <main className="mx-auto max-w-7xl px-5 pb-10 pt-10 lg:px-8 lg:pt-14">
        {activeView === "Overview" && (
          <>
            {" "}
            <section className="relative overflow-hidden pb-12">
              <div className="orb orb-one" />
              <div className="orb orb-two" />
              <div className="relative max-w-3xl">
                <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-.04em] text-white sm:text-6xl">
                  <span className="gradient-text">REST vs GraphQL</span>
                </h1>
                <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">
                  Explora el ecosistema de lanzamientos de SpaceX y analiza cómo
                  REST y GraphQL transforman la forma en que recibes tus datos.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    className="button-primary"
                    onClick={() => setActiveView("REST")}
                  >
                    <Code2 size={16} /> Explorar REST <ChevronRight size={15} />
                  </button>
                  <button
                    className="button-secondary"
                    onClick={() => setActiveView("GraphQL")}
                  >
                    <Network size={16} /> Explorar GraphQL
                  </button>
                </div>
              </div>
            </section>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="LATENCIA PROMEDIO"
                value={avgLatency}
                hint="Entre ambos endpoints"
                icon={Clock3}
              />
              <MetricCard
                label="CARGA REST"
                value={rest.metrics ? `${restPayload} KB` : "—"}
                hint="Respuesta completa"
                icon={Database}
                tone="violet"
              />
              <MetricCard
                label="CARGA GRAPHQL"
                value={graphql.metrics ? `${graphqlPayload} KB` : "—"}
                hint="Solo campos seleccionados"
                icon={Package}
                tone="cyan"
              />
              <MetricCard
                label="ANCHO DE BANDA AHORRADO"
                value={saving ? `${saving}%` : "—"}
                hint="GraphQL frente a REST"
                icon={Gauge}
                tone="amber"
              />
            </section>
            <section className="mt-16">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <p className="eyebrow text-cyan-300">EL LABORATORIO</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Elige tu capa de datos
                  </h2>
                </div>
                <span className="hidden text-xs text-slate-600 sm:block">
                  Mediciones en tiempo real de las APIs de SpaceX
                </span>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <button
                  onClick={() => setActiveView("REST")}
                  className="feature-card group text-left"
                >
                  <span className="feature-icon text-violet-300">
                    <Boxes size={22} />
                  </span>
                  <p className="eyebrow mt-6 text-violet-300">01 / API REST</p>
                  <h3 className="mt-2 text-xl font-medium text-white">
                    La imagen completa
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Examina la respuesta completa de recursos con estructura
                    predecible y caché HTTP nativo.
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm text-violet-300">
                    Ver misiones{" "}
                    <ChevronRight
                      size={15}
                      className="transition group-hover:translate-x-1"
                    />
                  </span>
                </button>
                <button
                  onClick={() => setActiveView("GraphQL")}
                  className="feature-card group text-left"
                >
                  <span className="feature-icon text-cyan-300">
                    <BrainCircuit size={22} />
                  </span>
                  <p className="eyebrow mt-6 text-cyan-300">02 / GRAPHQL</p>
                  <h3 className="mt-2 text-xl font-medium text-white">
                    Pide exactamente lo necesario
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Selecciona campos precisos en una sola operación y reduce el
                    exceso de datos descargados.
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm text-cyan-300">
                    Ver misiones{" "}
                    <ChevronRight
                      size={15}
                      className="transition group-hover:translate-x-1"
                    />
                  </span>
                </button>
              </div>
            </section>
            <section className="mt-16">
              <div className="mb-6">
                <p className="eyebrow text-amber-300">RESUMEN DEL BENCHMARK</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Rendimiento de un vistazo
                </h2>
              </div>
              <div className="panel">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <BarChart3 size={17} className="text-amber-300" />{" "}
                    Comparación de carga
                  </div>
                  <span className="text-xs text-slate-500">Menor es mejor</span>
                </div>
                <div className="space-y-5">
                  <ComparisonBar
                    label="REST / Respuesta completa"
                    value={restPayload}
                    max={Math.max(restPayload, graphqlPayload, 1)}
                    color="bg-violet-400"
                    suffix="KB"
                  />
                  <ComparisonBar
                    label="GraphQL / Campos seleccionados"
                    value={graphqlPayload}
                    max={Math.max(restPayload, graphqlPayload, 1)}
                    color="bg-cyan-400"
                    suffix="KB"
                  />
                </div>
              </div>
            </section>
          </>
        )}
        {activeView === "REST" && (
          <>
            <PageHeading
              eyebrow="REST / OPENAPI"
              title="Catálogo de misiones"
              description="Respuesta completa del último lanzamiento desde el endpoint REST de SpaceX."
            />
            <SourcePanel
              title="API REST"
              subtitle="GET · mock.pstmn.io/v4/launches/latest"
              accent="violet"
              launches={rest.data}
              metrics={rest.metrics}
              loading={rest.loading}
              error={rest.error}
              onReload={rest.reload}
            />
          </>
        )}
        {activeView === "GraphQL" && (
          <>
            <PageHeading
              eyebrow="GRAPHQL / CONSULTA PRECISA"
              title="Flujo de misiones seleccionado"
              description="La misma misión, solicitando únicamente los campos necesarios para la interfaz."
            />
            <SourcePanel
              title="API GRAPHQL"
              subtitle="POST · mock.pstmn.io/graphql"
              accent="cyan"
              launches={graphql.data}
              metrics={graphql.metrics}
              loading={graphql.loading}
              error={graphql.error}
              onReload={graphql.reload}
            />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ComparisonBar({
  label,
  value,
  max,
  color,
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  suffix: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-slate-200">
          {value ? `${value} ${suffix}` : "Cargando"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${Math.max(value ? (value / max) * 100 : 4, 4)}%` }}
        />
      </div>
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="mb-10 max-w-2xl">
      <p className="eyebrow text-cyan-300">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-.03em] text-white">
        {title}
      </h1>
      <p className="mt-4 leading-7 text-slate-400">{description}</p>
    </section>
  );
}

export default App;
