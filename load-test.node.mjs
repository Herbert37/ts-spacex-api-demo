import { performance } from "node:perf_hooks";

const REST_URL =
  "https://ceca21c3-ac8e-47a2-9a2e-bf9eb3aae13f.mock.pstmn.io/v4/launches/rest";
const GRAPHQL_URL =
  "https://ceca21c3-ac8e-47a2-9a2e-bf9eb3aae13f.mock.pstmn.io/v4/launches/graphql";
const GRAPHQL_BODY = JSON.stringify({
  query:
    "query LaunchLatest { launchLatest { mission_name launch_date_utc rocket { rocket_name rocket_type } details } }",
});

const vus = Number(process.env.LOAD_VUS ?? 20);
const durationSeconds = Number(process.env.LOAD_DURATION ?? 30);
const timeoutMilliseconds = Number(process.env.LOAD_TIMEOUT ?? 10000);
const allowInsecureTls = process.env.LOAD_INSECURE_TLS === "1";

if (
  !Number.isInteger(vus) ||
  vus < 1 ||
  !Number.isInteger(durationSeconds) ||
  durationSeconds < 1
) {
  throw new Error("LOAD_VUS y LOAD_DURATION deben ser enteros positivos.");
}

if (allowInsecureTls) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  console.warn(
    "Advertencia: TLS no verificado. Usa LOAD_INSECURE_TLS=1 solo en redes de desarrollo confiables.",
  );
}

const measurements = {
  rest: {
    latencies: [],
    payloads: [],
    errors: 0,
    requests: 0,
    successfulRequests: 0,
    errorMessages: new Set(),
  },
  graphql: {
    latencies: [],
    payloads: [],
    errors: 0,
    requests: 0,
    successfulRequests: 0,
    errorMessages: new Set(),
  },
};

function percentile(values, percentileValue) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((percentileValue / 100) * sorted.length) - 1,
  );
  return sorted[Math.max(0, index)];
}

function average(values) {
  return values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;
}

async function request(url, options, measurement, isGraphql = false) {
  const startedAt = performance.now();
  measurement.requests += 1;

  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeoutMilliseconds),
    });
    const body = await response.text();
    const elapsed = performance.now() - startedAt;
    const payloadBytes = Buffer.byteLength(body, "utf8");
    const validGraphqlResponse = !isGraphql || !body.includes('"errors"');

    if (!response.ok || !validGraphqlResponse) {
      measurement.errors += 1;
      measurement.errorMessages.add(
        `HTTP ${response.status}${isGraphql ? " o respuesta GraphQL inválida" : ""}`,
      );
      return;
    }

    measurement.latencies.push(elapsed);
    measurement.payloads.push(payloadBytes);
    measurement.successfulRequests += 1;
  } catch (error) {
    measurement.errorMessages.add(
      error instanceof Error ? error.message : "Error desconocido",
    );
    measurement.latencies.push(performance.now() - startedAt);
    measurement.errors += 1;
  }
}

async function virtualUser(deadline) {
  while (performance.now() < deadline) {
    await Promise.all([
      request(REST_URL, undefined, measurements.rest),
      request(
        GRAPHQL_URL,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: GRAPHQL_BODY,
        },
        measurements.graphql,
        true,
      ),
    ]);
  }
}

function formatMeasurement(name, measurement) {
  return {
    api: name,
    solicitudes: measurement.requests,
    exitosas: measurement.successfulRequests,
    errores: measurement.errors,
    promedioMs:
      measurement.successfulRequests > 0
        ? average(measurement.latencies).toFixed(2)
        : "N/D",
    p95Ms:
      measurement.successfulRequests > 0
        ? percentile(measurement.latencies, 95).toFixed(2)
        : "N/D",
    payloadPromedioKb:
      measurement.successfulRequests > 0
        ? (average(measurement.payloads) / 1024).toFixed(2)
        : "N/D",
    detalleError:
      measurement.errorMessages.size > 0
        ? [...measurement.errorMessages].join("; ")
        : "—",
  };
}

console.log(
  `Iniciando prueba local: ${vus} usuarios virtuales durante ${durationSeconds}s...`,
);
const startedAt = performance.now();
const deadline = startedAt + durationSeconds * 1000;
await Promise.all(Array.from({ length: vus }, () => virtualUser(deadline)));

const restResult = formatMeasurement("REST", measurements.rest);
const graphqlResult = formatMeasurement("GraphQL", measurements.graphql);
const restPayload = Number(restResult.payloadPromedioKb);
const graphqlPayload = Number(graphqlResult.payloadPromedioKb);
const saving =
  restPayload > 0 && graphqlPayload >= 0
    ? `${((1 - graphqlPayload / restPayload) * 100).toFixed(2)}%`
    : "N/D";

console.log("\nResultados");
console.table([restResult, graphqlResult]);
console.log(`Ahorro estimado de payload GraphQL: ${saving}`);
if (measurements.rest.errors > 0 || measurements.graphql.errors > 0) {
  console.log(
    "\nLa prueba no tiene resultados completos porque hubo solicitudes fallidas.",
  );
  //console.log('Si aparece SELF_SIGNED_CERT_IN_CHAIN en una red corporativa, ejecuta:')
  //console.log('  $env:LOAD_INSECURE_TLS=1; npm run test:load')
}
console.log(
  `Duración real: ${((performance.now() - startedAt) / 1000).toFixed(2)}s`,
);

if (measurements.rest.errors > 0 || measurements.graphql.errors > 0) {
  process.exitCode = 1;
}
