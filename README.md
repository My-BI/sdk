# MyBI SDK

Build signed extensions for MyBI. One repo, two SDKs:

- **[`adapter/`](./adapter)** — `@mybi/chart-adapter-sdk`: build a **chart adapter** that draws
  a MyBI `ChartSpec` with your charting library. Downloaded + verified at runtime; reads the
  host off `window.MyBIChartHost`.
- **[`plugins/`](./plugins)** — `@mybi/plugin-sdk`: build a **plugin** (surfaces, rails,
  settings) that runs in a sandboxed iframe and talks to MyBI through the `host` bridge.

Both ship as **signed packages** (`.mbia` / `.mbip`) and are verified (Ed25519)
before they run. You sign with your **own** key (it never leaves your machine); MyBI
countersigns it for the **verified** tier. See each folder's `RECIPE.md` + `SIGNING.md`.

> MyBI's plugin model evolved over time — this SDK reflects the **current** model (the old
> iframe-rendered detail UI is deprecated; detail pages are now host-rendered text +
> settings toggles).

MIT.
