import { defineConfig } from "vitest/config";
import path from "path";

// Standalone from vite.config.ts on purpose: the app config pulls in React /
// wasm / lovable-tagger plugins that the estimator core does not need. The
// core is framework-free — it runs in plain node.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
