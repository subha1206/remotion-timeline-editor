import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// On GitHub Pages the app is served from /<repo>/, so production assets need that
// base path. Dev stays at "/" so the local server URL is unaffected.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "production" ? "/remotion-timeline-editor/" : "/",
}));
