// Package the built adapter into an unsigned `<id>.mbia` (zip of manifest.json +
// bundle.js). Then sign it (see ../SIGNING.md).
//   npm run build && node build.mjs
import { execFileSync } from "node:child_process";
import { rmSync, mkdirSync, copyFileSync, readFileSync } from "node:fs";

const id = JSON.parse(readFileSync("manifest.json", "utf8")).id;
const out = `${id}.mbia`;
rmSync(out, { force: true });
rmSync("pkg", { recursive: true, force: true });
mkdirSync("pkg");
copyFileSync("manifest.json", "pkg/manifest.json");
copyFileSync("dist/bundle.js", "pkg/bundle.js");
execFileSync("zip", ["-j", out, "pkg/manifest.json", "pkg/bundle.js"], { stdio: "inherit" });
rmSync("pkg", { recursive: true, force: true });
console.log(`\n✓ Wrote ${out} (unsigned). Sign it — see ../SIGNING.md.`);
