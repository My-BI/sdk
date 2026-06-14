// Build the adapter into a single UMD with React (and your charting library) EXTERNAL —
// the MyBI host injects window.React, so the bundle must NOT carry its own React.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  // Classic JSX → React.createElement against the external window.React (no jsx-runtime leak).
  plugins: [react({ jsxRuntime: "classic" })],
  define: { "process.env.NODE_ENV": '"production"' },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: true,
    lib: {
      entry: resolve(__dirname, "src/adapter.tsx"),
      formats: ["umd"],
      name: "MyBIAdapter", // wrapper global (harmless — the entry assigns MyBIChartAdapter itself)
      fileName: () => "bundle.js",
    },
    rollupOptions: {
      // React MUST be external. Add your charting library here too (e.g. "recharts").
      external: ["react", "react-dom"],
      output: {
        globals: { react: "React", "react-dom": "ReactDOM" },
        inlineDynamicImports: true,
      },
    },
  },
});
