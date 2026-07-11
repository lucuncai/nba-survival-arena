import { defineConfig } from "vite";

export default defineConfig({
  base: "/nba-survival-arena/",
  build: {
    target: "es2022",
    sourcemap: true,
    assetsInlineLimit: 0,
  },
  server: {
    host: "0.0.0.0",
    port: 4173,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
});
