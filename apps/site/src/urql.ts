import { createClient } from "urql";

export const graph = createClient({
  url: "https://api.thegraph.com/subgraphs/name/ensdomains/ens",
});
