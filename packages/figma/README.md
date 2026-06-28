# @master/css.figma

Figma plugin for importing and exporting Master CSS variables and modes.

## Development

```bash
pnpm --filter @master/css.figma dev
```

## Build

```bash
pnpm --filter @master/css.figma build
```

The plugin bundle is built from `src/plugin.min.ts`; import and export UIs live in `src/import-variables.tsx` and `src/export-variables.tsx`.
