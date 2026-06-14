# mybi-plugin-hello

A minimal, working MyBI plugin — one surface that reads datasets + notifies, a settings
toggle, and host-rendered detail text. Starting point for your own plugin.

```sh
npm install
npm run build     # → hello.mybiplugin  (own React bundled; @mybi/host external)
# then sign it — see ../SIGNING.md
```

Edit [`src/index.tsx`](./src/index.tsx) (your surfaces / rails / settings) and
[`manifest.json`](./manifest.json) (`id`, `name`, `uses`). See [`../RECIPE.md`](../RECIPE.md).
