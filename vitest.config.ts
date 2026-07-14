import { defineConfig } from "vitest/config";
import path from "path";

// Standalone from vite.config.ts on purpose: the app config pulls in React /
// wasm / lovable-tagger plugins that the estimator core does not need. The
// core is framework-free — it runs in plain node.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // The estimator core is a workspace package consumed as TS source.
      "@appe/core": path.resolve(__dirname, "./packages/core/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "packages/*/src/**/*.test.ts"],
  },
});
