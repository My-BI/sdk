# @mybi/chart-adapter-sdk

Build your own **signed chart adapter** for MyBI. An adapter is a tiny UMD bundle that draws
a MyBI `ChartSpec` with the charting library of your choice — it ships as a `.mybiadapter`
(a zip of `manifest.json` + `bundle.js` + `signature.json`), is verified (Ed25519) before it
runs, and is downloaded on demand by MyBI.

## How it works

```
your adapter (bundle.js)            MyBI app
─────────────────────────           ────────────────────────────────────────
reads window.MyBIChartHost   ◄────  injects the host SDK + window.React before eval
reads window.React + your lib       resolves the spec → calls your Renderer
assigns globalThis.MyBIChartAdapter verifies the signature on download + every read
```

Your adapter imports **nothing** from the MyBI app — only the **types** in this package. At
runtime it reads the host off `window.MyBIChartHost` and React off `window.React` (both
injected by MyBI before your bundle is eval'd). React and your charting library stay
**external** (the host provides React; you don't bundle your own).

## The contract

```ts
import type { MyBIChartHost, ChartAdapterModule, ChartSpec, QueryResult } from "@mybi/chart-adapter-sdk";
```

- `MyBIChartHost` — everything the host provides: `data.shape`, `palette`, `theme`,
  `crossFilter`, `signals`, `analytics`, `format`, `maps`, `react`.
- `ChartAdapterModule` — what your bundle assigns to `globalThis.MyBIChartAdapter`
  (`id`, `name`, `framework`, `supportedKinds`, `capabilities(kind)`, `Renderer`, `apiVersion`).
- `HOST_API_VERSION` — declare the version you target; MyBI refuses anything newer than it runs.

## Get started

1. Copy [`adapter-template/`](./adapter-template) — a working example you can run.
2. Read [`RECIPE.md`](./RECIPE.md) — how to build the UMD (the externals are the only tricky part).
3. Read [`SIGNING.md`](./SIGNING.md) — how to get your adapter signed (first-party `mybi`,
   or `verified` via a MyBI countersign) and published.

## Trust

- **mybi** — signed by MyBI (first-party).
- **verified** — you sign with your own key + MyBI countersigns it (you keep your private key).
- **community** — registry-listed but unsigned; installs behind a consent prompt.

A signature proves **authorship**, not capability — adapters run in-process. Verify your own
build any time:

```sh
node scripts/verify-adapter.mjs my-adapter.mybiadapter
```

MIT.
