// Example MyBI chart adapter. Reads the host off window.MyBIChartHost + React off
// window.React (both injected by MyBI before this is eval'd) and draws a simple SVG column
// chart from the host's shaped data + resolved palette. Swap the Renderer for your charting
// library — keep React + your library EXTERNAL (see vite.config.ts).
import type { ChartSpec, QueryResult, ChartAdapterModule, MyBIChartHost, ChartKind } from "@mybi/chart-adapter-sdk";

const host = (globalThis as unknown as { MyBIChartHost: MyBIChartHost }).MyBIChartHost;
const React = host.react.React;
const h = React.createElement;

const SUPPORTED: ChartKind[] = ["column", "bar", "line", "area"];

function Renderer({ spec, result }: { spec: ChartSpec; result: QueryResult }) {
  const { data, measureKeys } = host.data.shape(spec, result);
  const colors = host.palette.usePalette(spec); // reactive — re-renders on palette change
  const dark = host.theme.isDark();
  const border = host.theme.cssVar("--border", "#2a3240");
  const mk = measureKeys[0];

  const vals = data.map((d) => Number(d[mk]) || 0);
  const max = Math.max(...vals, 1);
  const W = 600, H = 300, pad = 24, n = data.length || 1, slot = (W - pad * 2) / n, bw = slot * 0.7;

  return h(
    "svg",
    { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "none", style: { width: "100%", height: "100%" } },
    h("line", { x1: pad, y1: H - pad, x2: W - pad, y2: H - pad, stroke: border }),
    data.map((d, i) => {
      const v = Number(d[mk]) || 0;
      const bh = (H - pad * 2) * (v / max);
      return h("rect", {
        key: i, x: pad + i * slot + (slot - bw) / 2, y: H - pad - bh, width: bw, height: bh, rx: 2,
        fill: host.palette.legibleColor(colors[i % colors.length], dark),
      });
    }),
  );
}

const adapter: ChartAdapterModule = {
  apiVersion: 1,
  id: "example",
  name: "Example",
  framework: "react",
  supportedKinds: SUPPORTED,
  capabilities: () => ({ marks: true, axes: true, legend: true, dataLabels: false, data: true, crossFilter: false, highlight: false }),
  Renderer,
};

(globalThis as unknown as { MyBIChartAdapter: ChartAdapterModule }).MyBIChartAdapter = adapter;
