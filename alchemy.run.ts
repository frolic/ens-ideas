import alchemy from "alchemy";
import { GitHubComment } from "alchemy/github";
import { CloudflareStateStore } from "alchemy/state";
import { RateLimit, Worker } from "alchemy/cloudflare";

const app = await alchemy("instant-ens-api", {
  stateStore: (scope) => new CloudflareStateStore(scope),
});

export const worker = await Worker("worker", {
  name: app.name,
  entrypoint: "src/worker.ts",
  domains: ["api.instantens.com", "api.ensideas.com"],
  bindings: {
    ETHEREUM_RPC_URL: process.env.ETHEREUM_RPC_URL!,
    RATE_LIMITER: RateLimit({
      namespace_id: 1001,
      simple: { limit: 1000, period: 60 },
    }),
  },
});

if (process.env.PULL_REQUEST) {
  const previewUrl = worker.url;

  await GitHubComment("pr-preview-comment", {
    owner: process.env.GITHUB_REPOSITORY_OWNER || "frolic",
    repository: process.env.GITHUB_REPOSITORY_NAME || "instant-ens",
    issueNumber: Number(process.env.PULL_REQUEST),
    body: `
## 🚀 Preview Deployed

Your preview is ready!

**Preview URL:** ${previewUrl}

This preview was built from commit ${process.env.GITHUB_SHA}

---
<sub>🤖 This comment will be updated automatically when you push new commits to this PR.</sub>`,
  });
}

await app.finalize();
