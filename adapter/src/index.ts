// @mybi/chart-adapter-sdk — the stable contract a MyBI chart ADAPTER is built against.
// ============================================================================
// A MyBI chart adapter is a small UMD that draws a MyBI `ChartSpec` with a charting
// library. It reads the host off a single injected global, `window.MyBIChartHost`, and
// React off `window.React` — it imports nothing from the MyBI app. This file is the
// self-contained type contract; it mirrors the app's in-tree host surface 1:1.
//
// `apiVersion` gates compatibility: declare the version you target; the host refuses
// (falls back to bundled) anything newer than it can serve.
// ============================================================================

import type { ComponentType } from "react";

/** Bumped only on a breaking change to the surface below (additive preferred). */
export const HOST_API_VERSION = 1 as const;
export type HostApiVersion = typeof HOST_API_VERSION;

// ---- Value types the adapter speaks (structural — no MyBI-app dependency) ----

/** Known chart kinds, open to any string so new kinds don't break the type. */
export type ChartKind =
  | "column" | "bar" | "stackedColumn" | "stackedBar" | "line" | "area" | "stackedArea"
  | "pie" | "donut" | "scatter" | "radar" | "funnel" | "treemap" | "radialBar" | "composed"
  | "sunburst" | "sankey" | "heatmap" | "gauge" | "map" | "boxplot" | "candlestick"
  | (string & {});

export type ChartEngine = string;

/** Presentation options. Opaque except the keys your adapter reads (cast as needed). */
export interface ChartStyle { [k: string]: unknown }
/** Analytics-overlay config (trend / forecast / bands…). Opaque. */
export interface ChartAnalytics { [k: string]: unknown }

export interface ChartMeasure {
  agg?: string;
  column?: string;
  measureId?: string;
  measureName?: string;
}

export interface ChartSpec {
  id: string;
  datasetId: string;
  kind: ChartKind;
  engine?: ChartEngine;
  title?: string;
  category?: string;
  series?: string;
  measures: ChartMeasure[];
  style?: ChartStyle;
  analytics?: ChartAnalytics;
  drillthroughSheetId?: string;
}

export interface QueryColumn { name: string; role?: "dimension" | "measure"; data_type?: string }
export interface QueryResult { columns: QueryColumn[]; rows: (string | number | null)[][]; row_count?: number }

/** Which CORE settings a library supports for a kind (the host intersects with the type). */
export interface AdapterCapability {
  marks: boolean;
  axes: boolean;
  legend: boolean;
  dataLabels: boolean;
  data: boolean;
  crossFilter: boolean;
  highlight: boolean;
}

// ---- The host surface (window.MyBIChartHost) ----

export interface HostData {
  /** Shape a QueryResult into draw records: one row per category, a key per measure,
   *  a bound Series pivoted to one key per distinct value. */
  shape(spec: ChartSpec, result: QueryResult): {
    data: Record<string, string | number>[];
    measureKeys: string[];
    catKey: string;
  };
  measureAlias(m: ChartMeasure): string;
  measureLabel(m: ChartMeasure): string;
}

export interface HostThemeTokens {
  text: string; textDim: string; border: string; borderStrong: string; bgElev: string; bgElev2: string;
}
export interface HostTheme {
  isDark(): boolean;
  cssVar(name: string, fallback: string): string;
  textColor(style: ChartStyle | undefined): string | undefined;
  fontFamily(style: ChartStyle | undefined): string | undefined;
  tokens(): HostThemeTokens;
}

export interface HostPalette {
  /** Fully-resolved ordered series colours for this spec (monochrome / pinned / active /
   *  lead / reverse applied; NOT yet legible — call legibleColor per swatch). Snapshot. */
  resolve(spec: ChartSpec): string[];
  /** Reactive form (a React hook) — re-renders the caller when the palette changes. */
  usePalette(spec: ChartSpec): string[];
  /** Whether accessibility monochrome mode is on. */
  isMonochrome(): boolean;
  /** Nudge a colour legible for the theme. */
  legibleColor(hex: string, dark: boolean): string;
  /** Conditional per-bar colour (gradient / rules / single), or null for the default. */
  barCellColor(value: number, lo: number, hi: number, style: ChartStyle | undefined): string | null;
}

export interface HostCrossFilterState { source: string; datasetId?: string; column?: string; value?: string }
export interface HostCrossFilter {
  active(): HostCrossFilterState | null;
  useActive(): HostCrossFilterState | null;
  select(p: { source: string; datasetId: string; column: string; value: string }): void;
  clear(source: string): void;
  gotoSheet(sheetId: string): void;
}

export interface HostSignals {
  legendItems(chartId: string, items: { label: string; color: string }[]): void;
  paletteFit(p: { chartId: string; partial: boolean; needed: number; available: number }): void;
}

export interface HostAnalytics {
  applies(kind: ChartKind): boolean;
  mean(v: number[]): number;
  stddev(v: number[]): number;
  cumulative(v: number[]): number[];
  movingAverage(v: number[], w: number): number[];
  anomalyIndices(v: number[], z?: number): number[];
  forecast(v: number[], periods: number, method?: "linear" | "movingAverage"): number[];
  fitTrend(v: number[], model?: string, degree?: number): { predict: (i: number) => number; r2: number };
  referenceLines(v: number[], a: ChartAnalytics): { label: string; value: number }[];
  kmeans(pts: { x: number; y: number }[], k: number): number[];
}

export interface HostFormat { num(v: unknown, decimals?: number): string }

/** Map GeoJSON asset URLs the app holds (a downloaded adapter can't bundle them). */
export interface MapAssets {
  worldDefault: string; admin1: string; ukNations: string; usCounties: string; disputed: string;
  pov: Record<string, string>;
}
export interface HostMaps { assetUrls(): MapAssets }

export interface HostReact {
  React: typeof import("react");
  ReactDOM: typeof import("react-dom");
  ReactIs?: unknown;
}

/** The single global a downloaded adapter is built against (injected before eval, frozen). */
export interface MyBIChartHost {
  apiVersion: HostApiVersion;
  data: HostData;
  theme: HostTheme;
  palette: HostPalette;
  crossFilter: HostCrossFilter;
  signals: HostSignals;
  analytics: HostAnalytics;
  format: HostFormat;
  maps: HostMaps;
  react: HostReact;
}

/** What an adapter bundle assigns to globalThis.MyBIChartAdapter. */
export interface ChartAdapterModule {
  apiVersion: number;
  id: ChartEngine;
  name: string;
  framework: "react" | "global";
  supportedKinds: readonly ChartKind[];
  capabilities(kind: ChartKind): AdapterCapability;
  Renderer: ComponentType<{ spec: ChartSpec; result: QueryResult }>;
}

declare global {
  interface Window { MyBIChartHost?: MyBIChartHost }
}
