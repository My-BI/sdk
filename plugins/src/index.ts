// @mybi/plugin-sdk — the contract a MyBI PLUGIN is built against (current model).
// ============================================================================
// A plugin is a CommonJS module bundled into a `.mbip` zip (manifest.json + index.js
// + optional signature.json). It runs in a token-validated, capability-scoped IFRAME sandbox
// (no network egress). It calls `registerPlugin(def)` ONCE with a manifest + contributions
// (React components for surfaces/rails/settings); the host then renders those on demand and
// drives their lifecycle. The plugin reaches MyBI ONLY through the async `host` bridge,
// gated by trust tier + declared `uses` + per-dashboard policy + write consent.
//
//   import { host, registerPlugin } from "@mybi/host";
//   import type { PluginDefinition } from "@mybi/plugin-sdk";
//
// NOTE: the OLD iframe-rendered `detailTabs` model is DEPRECATED. A plugin's detail page is
// now HOST-rendered structured text (`detailDocs`) + `settingsToggles` — no custom detail UI.
// ============================================================================

import type { ComponentType } from "react";

/** Capability namespaces — list the ones you call in `manifest.uses` to unlock them.
 *  `git`/`fs`/`canvas` are FIRST-PARTY only; `dataset`/`net` are tier+policy gated;
 *  `ui`/`settings` are available to all tiers. */
export type CapabilityNamespace = "git" | "fs" | "dataset" | "settings" | "ui" | "net" | "canvas";

export type PluginTier = "mybi" | "verified" | "community" | "unverified";

// ---- Manifest -------------------------------------------------------------

export interface LicenseNotice { name: string; spdx?: string; url?: string; text?: string }

export interface PluginManifest {
  /** filesystem-safe: alphanumeric + hyphen/underscore, ≤ 64 chars. */
  id: string;
  name: string;
  /** semantic version (bound by the signature). */
  version: string;
  /** capability namespaces the plugin calls. */
  uses: CapabilityNamespace[];
  /** optional declarative slots the host can read WITHOUT running the iframe. */
  contributes?: ContributionDescriptors;
  license?: string;
  notices?: LicenseNotice[];
  author?: string;
  description?: string;
  features?: string[];
  repo?: string;
}

// ---- Contributions (what the plugin adds to the workbench) -----------------

export interface ActivityBarItem {
  id: string;
  label: string;
  /** SVG path data, drawn in a 24px viewBox. */
  icon: string;
  order?: number;
  /** id of a `surfaces[]` entry this opens. */
  surface: string;
}
export interface RailItem {
  id: string;
  label: string;
  icon: string;
  order?: number;
  /** React component rendered in the iframe. */
  Panel: ComponentType;
}
/** Right-rail panel targeting a specific host area. */
export interface RightRailItem extends RailItem {
  host: "data" | "canvas" | "models" | "plugins" | "settings";
}
export interface SettingsTabItem { id: string; label: string; Panel: ComponentType }
export interface SurfaceItem { id: string; Main: ComponentType }

/** Host-rendered detail-page content (replaces the deprecated iframe `detailTabs`). */
export interface DocSpan { text: string; bold?: boolean; italic?: boolean; underline?: boolean }
export type DocBlock =
  | { type: "heading"; spans: DocSpan[] }
  | { type: "paragraph"; spans: DocSpan[] }
  | { type: "bullets"; items: DocSpan[][] }
  | { type: "divider" }
  | { type: "code"; code: string; label?: string; desc?: string };
export interface DetailDocDescriptor {
  /** "overview" fills the standard first Overview tab; any other id is its own tab. */
  id: string;
  label?: string;
  order?: number;
  blocks: DocBlock[];
}
/** The ONLY interactive control a plugin may add to its detail page (Settings tab). */
export interface PluginSettingToggle { key: string; label: string; help?: string; default?: boolean }

/** A chart type a plugin offers (manifest-driven; host renders the card). */
export interface ChartTypeDescriptor {
  id: string; label: string; icon: string;
  summary?: string; whenToUse?: string; needs?: string;
}

export interface Contributions {
  activityBar?: ActivityBarItem[];
  dataRail?: RailItem[];
  canvasRail?: RailItem[];
  rightRail?: RightRailItem[];
  settingsTabs?: SettingsTabItem[];
  surfaces?: SurfaceItem[];
  chartTypes?: ChartTypeDescriptor[];
  detailDocs?: DetailDocDescriptor[];
  settingsToggles?: PluginSettingToggle[];
}

/** Serializable mirror of Contributions (no components) — what the host reads from the
 *  manifest / receives across the bridge to place the iframe in each slot. */
export interface ContributionDescriptors {
  activityBar?: { id: string; label: string; icon: string; order?: number; surface: string }[];
  dataRail?: { id: string; label: string; icon: string; order?: number }[];
  canvasRail?: { id: string; label: string; icon: string; order?: number }[];
  rightRail?: { id: string; label: string; icon: string; order?: number; host: RightRailItem["host"] }[];
  settingsTabs?: { id: string; label: string }[];
  surfaces?: { id: string }[];
  chartTypes?: ChartTypeDescriptor[];
  detailDocs?: DetailDocDescriptor[];
  settingsToggles?: PluginSettingToggle[];
}

/** What a plugin passes to `registerPlugin`. */
export interface PluginDefinition {
  manifest: PluginManifest;
  contributes: Contributions;
  /** Optional lifecycle hook, run once after the iframe initialises. */
  activate?: () => void | Promise<void>;
}

// ---- The host bridge (async; every method returns a Promise) ---------------

export interface DataPage { columns: { name: string; type?: string }[]; rows: (string | number | null)[][]; total?: number }
export interface DatasetSchema { columns: { name: string; type: string }[] }

export interface HostDataset {
  getDatasets(): Promise<{ id: string; name: string }[]>;
  getSelectedDatasetId(): Promise<string | null>;
  selectDataset(id: string): Promise<void>;
  getData(id: string, offset?: number, limit?: number): Promise<DataPage>;
  getSchema(id: string): Promise<DatasetSchema>;
  /** Reactive hooks (use inside a Panel/Surface component). */
  useSelectedDatasetId(): string | null;
  useDatasets(): { id: string; name: string }[];
  // …transform/commit methods (listCommits/createCommit/checkout/merge/…) require write
  //   consent and are tier-gated; see the docs.
  [method: string]: unknown;
}
export interface HostSettings {
  /** Namespaced to plugin.<id>.<key>. */
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}
export interface HostUi {
  notify(kind: "info" | "success" | "warn" | "error", text: string): Promise<void>;
  openSurface(id: string): Promise<void>;
  busEmit(name: string, payload?: unknown): Promise<void>;
  confirm(message: string): Promise<boolean>;
  canAuthenticate(): Promise<boolean>;
  authenticate(reason: string): Promise<boolean>;
  /** Subscribe to a host event channel; returns an unsubscribe fn. */
  bus: { on(name: string, fn: (payload: unknown) => void): () => void };
}
export interface HostNet { fetch(url: string): Promise<{ ok: boolean; status: number; text(): Promise<string> }> }

/** The bounded surface a plugin calls back into MyBI. Namespaces beyond your `uses` (or
 *  above your tier) throw "denied". */
export interface Host {
  dataset: HostDataset;
  settings: HostSettings;
  ui: HostUi;
  net: HostNet;
  /** first-party only */
  git?: Record<string, (...a: unknown[]) => Promise<unknown>>;
  fs?: Record<string, (...a: unknown[]) => Promise<unknown>>;
  canvas?: {
    placeChart(chartType: string, datasetId?: string, x?: number, y?: number): Promise<string>;
    armChartDrag(chartType: string | null, datasetId?: string): Promise<void>;
  };
}

/** The `@mybi/host` module the iframe injects. */
export interface HostModule {
  host: Host;
  registerPlugin(def: PluginDefinition): void;
}

declare global {
  // eslint-disable-next-line no-var
  var registerPlugin: (def: PluginDefinition) => void;
}
