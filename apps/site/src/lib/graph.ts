const ENDPOINT = "https://api.thegraph.com/subgraphs/name/ensdomains/ens";

/**
 * Runs a GraphQL query against the ENS subgraph and returns the `data` payload.
 */
export async function queryGraph(query: string, variables?: object) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  return json.data;
}
