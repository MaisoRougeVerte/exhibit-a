import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const LOCAL_ART_DIR = join(import.meta.dirname, "local-art");
const VIRTUAL_ID = "virtual:local-art";

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => relative(LOCAL_ART_DIR, join(entry.parentPath, entry.name)));
}

/**
 * Test art in local-art/ is not ours to publish. The dev server serves it as static files
 * and lists it through a virtual module; a production build gets an empty list, and fails
 * if anything from that folder ever reaches the bundle.
 */
function localArt(isServe: boolean): Plugin {
  return {
    name: "local-art",
    resolveId: (id) => (id === VIRTUAL_ID ? `\0${VIRTUAL_ID}` : undefined),
    async load(id) {
      if (id !== `\0${VIRTUAL_ID}`) return undefined;
      const files = isServe ? await listFiles(LOCAL_ART_DIR) : [];
      return `export const localArtFiles = ${JSON.stringify(files)};`;
    },
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        const text = output.type === "chunk" ? output.code : "";
        if (output.fileName.endsWith(".gif") || text.includes("local-art/")) {
          this.error(`local test art leaked into the production bundle: ${output.fileName}`);
        }
      }
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss(), localArt(command === "serve")],
  publicDir: command === "serve" ? "local-art" : false,
  // Recorded trials live in the repo-level `cases/` folder, outside the app root.
  server: { fs: { allow: ["../.."] } },
}));
