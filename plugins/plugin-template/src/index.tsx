// Starter MyBI plugin. Runs in an isolated iframe sandbox, so it bundles its OWN React;
// only @mybi/host is external (the host shim provides it). Build → hello.mbip.
import { useState } from "react";
import { host, registerPlugin } from "@mybi/host";
import type { PluginDefinition } from "@mybi/plugin-sdk";

// A full-page surface (opened from the activity-bar item below).
function HelloSurface() {
  const datasets = host.dataset.useDatasets(); // reactive host hook
  const [n, setN] = useState(0);
  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h2>Hello from a MyBI plugin</h2>
      <p>{datasets.length} dataset(s) in this project.</p>
      <button onClick={() => { setN(n + 1); void host.ui.notify("info", `Clicked ${n + 1}×`); }}>
        Notify ({n})
      </button>
    </div>
  );
}

const def: PluginDefinition = {
  manifest: { id: "hello", name: "Hello Plugin", version: "1.0.0", uses: ["ui", "dataset", "settings"] },
  contributes: {
    activityBar: [{ id: "hello", label: "Hello", icon: "M4 12h16M12 4v16", surface: "hello" }],
    surfaces: [{ id: "hello", Main: HelloSurface }],
    // The ONLY interactive control allowed on the detail page (host-rendered).
    settingsToggles: [{ key: "verbose", label: "Verbose logging", help: "Log host calls.", default: false }],
    // Host-rendered detail text (no custom detail UI in the new model).
    detailDocs: [{
      id: "overview",
      blocks: [
        { type: "paragraph", spans: [{ text: "A starter MyBI plugin — one surface that reads datasets and notifies." }] },
        { type: "bullets", items: [
          [{ text: "Edit " }, { text: "src/index.tsx", bold: true }],
          [{ text: "npm run build → hello.mbip" }],
          [{ text: "Sign it — see ../SIGNING.md" }],
        ] },
      ],
    }],
  },
  activate() { void host.ui.notify("info", "Hello plugin activated"); },
};

registerPlugin(def);
