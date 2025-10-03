import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  format: "iife",
  publicDir: "public",
  entry: ["src/background.ts", "src/content.ts", "src/style.css"],
  watch: process.env.NODE_ENV === "development" ? ["src"] : false
});
