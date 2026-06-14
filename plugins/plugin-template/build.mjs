// Build the plugin → <id>.mybiplugin. Bundles its OWN React (the iframe is an isolated
// realm); only @mybi/host is external (the host shim provides it). CJS + zip.
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(dir, "dist");
rmSync(dist, { recursive: true, force: true }); mkdirSync(dist, { recursive: true });

await build({
  entryPoints: [path.join(dir, "src/index.tsx")],
  bundle: true, format: "cjs", platform: "browser", target: "es2021", jsx: "automatic",
  outfile: path.join(dist, "index.js"),
  external: ["@mybi/host"], // React is bundled in; only the host bridge is external
  logLevel: "info",
});

const id = JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8")).id;
writeFileSync(path.join(dist, "manifest.json"), readFileSync(path.join(dir, "manifest.json")));
const out = path.join(dir, `${id}.mybiplugin`);
rmSync(out, { force: true });
execFileSync("zip", ["-j", out, path.join(dist, "manifest.json"), path.join(dist, "index.js")], { stdio: "inherit" });
console.log(`\n✓ Built ${id}.mybiplugin (unsigned). Sign it — see ../SIGNING.md.`);
