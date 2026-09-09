import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repo = "projects"; // GitHub repo name — update if you rename the repository

export default defineConfig(({ mode }) => ({
  // GitHub Pages needs the repo subpath; set GITHUB_PAGES=1 in the deploy
  // workflow. Everything else (local dev, other hosting) serves at "/".
  base: process.env.GITHUB_PAGES ? `/${repo}/` : "/",
  plugins: [react()],
  server: {
    host: true,
    // Sandbox/cloud previews are proxied under random *.e2b.app hosts — allow them.
    allowedHosts: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
}));
