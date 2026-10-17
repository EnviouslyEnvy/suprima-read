import { cpSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const standalone = path.join(root, ".next", "standalone");
const server = path.join(standalone, "server.js");
if (!existsSync(server)) {
  console.error("Build the app with npm run build before starting production.");
  process.exit(1);
}

// Standalone output needs its static assets copied alongside the server.
cpSync(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), { recursive: true });
cpSync(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
process.env.HOSTNAME ||= "127.0.0.1";
await import(pathToFileURL(server).href);
