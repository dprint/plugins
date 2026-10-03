import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  // GitHub rate limits unauthenticated API requests by IP address, which CI
  // runners share, so allow providing a token for the requests the tests make
  const githubToken = loadEnv(mode, ".", "DPRINT_PLUGINS_").DPRINT_PLUGINS_GH_TOKEN;

  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.toml" },
        miniflare: githubToken
          ? { bindings: { DPRINT_PLUGINS_GH_TOKEN: githubToken } }
          : undefined,
      }),
    ],
  };
});
