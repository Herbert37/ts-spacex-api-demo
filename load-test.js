import http from "k6/http";
import { check } from "k6";
import { Trend, Counter } from "k6/metrics";

export const options = {
  scenarios: {
    rest_and_graphql: {
      executor: "constant-vus",
      vus: 20,
      duration: "30s",
    },
  },
  thresholds: {
    rest_latency: ["p(95)<2000"],
    graphql_latency: ["p(95)<2000"],
    rest_payload_bytes: ["avg<100000"],
    graphql_payload_bytes: ["avg<100000"],
  },
};

const restLatency = new Trend("rest_latency", true);
const graphqlLatency = new Trend("graphql_latency", true);
const restPayload = new Trend("rest_payload_bytes", true);
const graphqlPayload = new Trend("graphql_payload_bytes", true);
const errors = new Counter("api_errors");
const restUrl =
  "https://ceca21c3-ac8e-47a2-9a2e-bf9eb3aae13f.mock.pstmn.io/v4/launches/rest";
const graphqlUrl =
  "https://ceca21c3-ac8e-47a2-9a2e-bf9eb3aae13f.mock.pstmn.io/v4/launches/graphql";
const graphqlQuery = JSON.stringify({
  query: `query LaunchLatest { launchLatest { mission_name launch_date_utc rocket { rocket_name rocket_type } details } }`,
});

export default function () {
  const rest = http.get(restUrl, { tags: { api: "rest" } });
  const graphql = http.post(graphqlUrl, graphqlQuery, {
    headers: { "Content-Type": "application/json" },
    tags: { api: "graphql" },
  });
  restLatency.add(rest.timings.duration);
  graphqlLatency.add(graphql.timings.duration);
  restPayload.add(Number(rest.headers["Content-Length"] || rest.body.length));
  graphqlPayload.add(
    Number(graphql.headers["Content-Length"] || graphql.body.length),
  );
  check(rest, {
    "REST status is 200": (response) => response.status === 200,
  }) || errors.add(1);
  check(graphql, {
    "GraphQL status is 200": (response) =>
      response.status === 200 && !response.body.includes('"errors"'),
  }) || errors.add(1);
}
