# mybi-adapter-example

A minimal, working MyBI chart adapter — draws an SVG column chart from the host's shaped data
+ resolved palette. Use it as the starting point for your own adapter.

```sh
npm install
npm run build        # → dist/bundle.js  (React external)
npm run package      # → example.mybiadapter  (unsigned)
# then sign it — see ../SIGNING.md
```

Edit [`src/adapter.tsx`](./src/adapter.tsx) to draw with your charting library (keep it
external in [`vite.config.ts`](./vite.config.ts)), and update [`manifest.json`](./manifest.json)
(`id`, `name`, `supportedKinds`). See [`../RECIPE.md`](../RECIPE.md) for the full guide.
