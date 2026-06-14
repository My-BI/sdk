# Build recipe — turning your adapter into a `.mybiadapter`

An adapter bundle is a **UMD** that:
1. reads `window.MyBIChartHost` + `window.React` (and your charting library global),
2. assigns its `ChartAdapterModule` to `globalThis.MyBIChartAdapter`,
3. keeps React + your library **external** (the host injects them — don't bundle your own).

The only non-obvious part is the **externals**: a runtime-loaded bundle isn't processed by
MyBI's bundler, so it must borrow `window.React` rather than ship its own (two React copies
break hooks).

## 1. Write the adapter

See [`adapter-template/src/adapter.tsx`](./adapter-template/src/adapter.tsx). Skeleton:

```tsx
import type { ChartSpec, QueryResult, ChartAdapterModule, MyBIChartHost } from "@mybi/chart-adapter-sdk";

const host = (globalThis as unknown as { MyBIChartHost: MyBIChartHost }).MyBIChartHost;
const React = host.react.React;

function Renderer({ spec, result }: { spec: ChartSpec; result: QueryResult }) {
  const { data, measureKeys, catKey } = host.data.shape(spec, result);
  const colors = host.palette.usePalette(spec);
  // …draw with your library (React component using window.React + your lib global)…
}

const adapter: ChartAdapterModule = {
  apiVersion: 1, id: "mychart", name: "My Chart", framework: "react",
  supportedKinds: ["column", "bar", "line"],
  capabilities: () => ({ marks: true, axes: true, legend: true, dataLabels: true, data: true, crossFilter: true, highlight: true }),
  Renderer,
};
(globalThis as unknown as { MyBIChartAdapter: ChartAdapterModule }).MyBIChartAdapter = adapter;
```

## 2. Build the UMD (externals are the key)

See [`adapter-template/vite.config.ts`](./adapter-template/vite.config.ts):

```ts
build: {
  lib: { entry: "src/adapter.tsx", formats: ["umd"], name: "MyBIAdapter", fileName: () => "bundle.js" },
  rollupOptions: {
    external: ["react", "react-dom", /* your charting lib, e.g. */ "recharts"],
    output: { globals: { react: "React", "react-dom": "ReactDOM", recharts: "Recharts" }, inlineDynamicImports: true },
  },
},
plugins: [react({ jsxRuntime: "classic" })], // classic JSX → React.createElement against the external React
```

```sh
npm run build      # → dist/bundle.js
```

## 3. Package the `.mybiadapter`

`manifest.json` (bound by the signature — id + version are required):

```json
{ "id": "mychart", "version": "1.0.0", "name": "My Chart", "framework": "react", "apiVersion": 1, "engine": "mychart", "supportedKinds": ["column","bar","line"] }
```

```sh
node build.mjs     # zips manifest.json + dist/bundle.js → mychart.mybiadapter (unsigned)
```

## 4. Sign + publish

See [`SIGNING.md`](./SIGNING.md).

## Notes

- **Your charting library**: keep it external too. MyBI exposes the bundled first-party
  libraries as globals (e.g. `window.Recharts`); for your own library, either rely on MyBI
  exposing it or have your adapter load it (and declare it external so it isn't double-bundled).
- **Maps/3D**: geo GeoJSON comes from `host.maps.assetUrls()`; heavy 3D libs aren't injected
  — exclude those kinds from `supportedKinds` (MyBI falls back to a bundled renderer per kind).
- **apiVersion**: target `HOST_API_VERSION`. MyBI refuses an adapter whose `apiVersion` is
  higher than the host it runs, falling back to bundled.
