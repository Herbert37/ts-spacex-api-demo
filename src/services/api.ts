import type { ApiKind, ApiResult, Launch } from "../types/api";

const MOCK_BASE_URL =
  "https://ceca21c3-ac8e-47a2-9a2e-bf9eb3aae13f.mock.pstmn.io";
const REST_URL = `${MOCK_BASE_URL}/v4/launches/rest`;
const GRAPHQL_URL = `${MOCK_BASE_URL}/v4/launches/graphql`;

const calculatePayload = (value: unknown) =>
  new Blob([JSON.stringify(value)]).size / 1024;

const createMetrics = (
  kind: ApiKind,
  start: number,
  payload: unknown,
): ApiResult<unknown>["metrics"] => ({
  kind,
  latency: Math.round(performance.now() - start),
  payload: Number(calculatePayload(payload).toFixed(1)),
  timestamp: new Date().toISOString(),
  status: "success",
});

const extractUrl = (value: unknown): string | null => {
  if (typeof value !== "string" || value.length === 0) return null;
  const markdownMatch = value.match(/\]\(([^)]+)\)/);
  return markdownMatch?.[1] ?? value;
};

const normalizeLaunch = (
  launch: Record<string, unknown>,
  index: number,
  kind: ApiKind,
): Launch => {
  const dateValue = kind === "REST" ? launch.date_utc : launch.launch_date_utc;
  const rocket = launch.rocket;
  const customer = launch.customers;
  const links = (launch.links ?? {}) as Record<string, unknown>;
  const failures = launch.failures;
  const success = launch.success;
  const rocketName =
    typeof rocket === "object" && rocket !== null
      ? (rocket as Record<string, unknown>).rocket_name
      : rocket;
  return {
    id: String(launch.id ?? `${kind.toLowerCase()}-${index}`),
    name: String(launch.name ?? "Unnamed mission"),
    date: String(dateValue ?? new Date().toISOString()),
    status:
      launch.upcoming === true
        ? "upcoming"
        : success === true
          ? "success"
          : success === false ||
              (Array.isArray(failures) && failures.length > 0)
            ? "failed"
            : "unknown",
    rocket: typeof rocketName === "string" ? rocketName : "Falcon 9",
    customer:
      Array.isArray(customer) && customer.length > 0
        ? String(customer[0])
        : "Commercial mission",
    image:
      typeof links.patch === "object" && links.patch !== null
        ? extractUrl((links.patch as Record<string, unknown>).small)
        : extractUrl(links.patch),
    details: typeof launch.details === "string" ? launch.details : null,
    webcast: extractUrl(links.webcast),
  };
};

export async function fetchRestLaunches(
  signal?: AbortSignal,
): Promise<ApiResult<Launch[]>> {
  const start = performance.now();
  const response = await fetch(REST_URL, { signal });
  if (!response.ok)
    throw new Error(`REST respondió con HTTP ${response.status}`);
  const raw: unknown = await response.json();
  if (typeof raw !== "object" || raw === null || Array.isArray(raw))
    throw new Error("La respuesta REST no tiene el formato esperado");
  return {
    data: [normalizeLaunch(raw as Record<string, unknown>, 0, "REST")],
    metrics: createMetrics("REST", start, raw),
  };
}

const GRAPHQL_QUERY = `query LaunchLatest {
  launchLatest {
    mission_name
    launch_date_utc
    rocket {
      rocket_name
      rocket_type
    }
    details
  }
}`;

export async function fetchGraphqlLaunches(
  signal?: AbortSignal,
): Promise<ApiResult<Launch[]>> {
  const start = performance.now();
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: GRAPHQL_QUERY }),
    signal,
  });
  if (!response.ok)
    throw new Error(`GraphQL respondió con HTTP ${response.status}`);
  const raw: unknown = await response.json();
  const payload = raw as {
    data?: { launchLatest?: unknown };
    errors?: Array<{ message?: string }>;
  };
  if (payload.errors?.length)
    throw new Error(payload.errors[0].message ?? "GraphQL devolvió un error");
  if (
    typeof payload.data?.launchLatest !== "object" ||
    payload.data.launchLatest === null
  )
    throw new Error("La respuesta GraphQL no tiene el formato esperado");
  const launch = payload.data.launchLatest as Record<string, unknown>;
  return {
    data: [
      normalizeLaunch({ ...launch, name: launch.mission_name }, 0, "GraphQL"),
    ],
    metrics: createMetrics("GraphQL", start, raw),
  };
}

export const apiEndpoints = { rest: REST_URL, graphql: GRAPHQL_URL };
