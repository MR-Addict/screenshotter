import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  minify: true,
  format: "iife",
  publicDir: "public",
  entry: ["src/background.ts"]
});
