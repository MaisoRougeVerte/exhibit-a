import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Recorded trials live in the repo-level `cases/` folder, outside the app root.
  server: { fs: { allow: ["../.."] } },
});
