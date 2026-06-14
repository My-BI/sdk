# Build recipe — MyBI plugin

A plugin is a CommonJS `index.js` (+ `manifest.json`) zipped into a `.mbip`. It runs in
an **isolated iframe sandbox**, so it **bundles its own React**; only `@mybi/host` is external
(the host shim provides it). No network egress (use `host.net`, which is policy-gated).

## 1. Register (once)

```tsx
import { host, registerPlugin } from "@mybi/host";
import type { PluginDefinition } from "@mybi/plugin-sdk";

registerPlugin({
  manifest: { id: "mychart", name: "My Plugin", version: "1.0.0", uses: ["ui", "dataset"] },
  contributes: {
    activityBar: [{ id: "x", label: "X", icon: "M4 12h16", surface: "x" }],
    surfaces: [{ id: "x", Main: MySurface }],
    settingsToggles: [{ key: "opt", label: "An option", default: false }],
    detailDocs: [{ id: "overview", blocks: [{ type: "paragraph", spans: [{ text: "What it does." }] }] }],
  },
});
```

## 2. Build (esbuild → CJS, `@mybi/host` external, React bundled)

See [`plugin-template/build.mjs`](./plugin-template/build.mjs):
```js
await build({ entryPoints: ["src/index.tsx"], bundle: true, format: "cjs", jsx: "automatic",
  outfile: "dist/index.js", external: ["@mybi/host"] });   // React bundled in
```

## 3. Package → `.mbip` (zip `manifest.json` + `index.js`)

## 4. Sign + publish → [`SIGNING.md`](./SIGNING.md)

## What a plugin can do

- **Surfaces / rails / settings tabs** — React components the host renders in your iframe.
- **Detail page** — host-rendered structured text (`detailDocs`) + `settingsToggles` ONLY
  (the old iframe `detailTabs` is deprecated).
- **`host.*` bridge** — `dataset` (read free; writes need consent), `settings`, `ui`, `net`
  (policy-gated). `git` / `fs` / `canvas` are **first-party only**.
- **Capabilities** are gated by trust tier (`mybi` > `verified` > `community` > `unverified`),
  your declared `manifest.uses`, and a per-dashboard policy. Declare only what you use.
