# AI Notes For `@master/css-next`

## Responsibility

`@master/css-next` integrates Master CSS with Next.js.

## Owns

- `pre-render` mode through the Next.js Adapter API.
- `runtime` mode through the Next client instrumentation hook.
- `progressive` mode as runtime plus pre-render behavior.
- `static` mode through generated CSS and Turbopack scanner loaders.
- Next-specific manifest import/loaders and static CSS loaders.
- Build output rendering helpers.

## Does Not Own

- Dynamic SSR response transformation.
- App Router request-time class collection.
- Static extraction semantics; `MasterCSSScanner` remains the source of static behavior.
- Webpack-specific extraction internals.
- React component registry/provider APIs.

## Public Surface

- Default `withMasterCSS()`.
- Named `withMasterCSS`.
- `createAdapter`.
- `renderNextBuildOutputs`.
- `./adapter`.

## Key Files

- `src/index.ts`
- `src/adapter.ts`
- `src/static.ts`
- `src/static-css-loader.ts`
- `src/static-loader.ts`
- `src/css-manifest-loader.ts`
- `src/css-manifest-import-loader.ts`
- `src/options.ts`
- Generated `node_modules/.master-css/master-css-next-instrumentation-client.js` source from `src/index.ts`

## Risk Areas

- Next Adapter API type changes across Next major versions.
- Accidentally processing non-HTML assets.
- Duplicate writes for fallback HTML listed through multiple output groups.
- Turbopack loader behavior as an incremental scanner.
- Over-broad Turbopack JS loader rules breaking Next client component classification for linked workspace packages.
- Runtime injection must preserve user `instrumentation-client` via the secondary alias before overriding Next's `private-next-instrumentation-client`.
- Runtime, preload, mode default, and cascade-layer changes must be audited against Vite, Webpack, Nuxt, and Astro so integration behavior does not drift.

## Safe Changes

- Focused adapter, static loader, or manifest loader fixes with tests.
- Turbopack loader fixes that preserve guarded `content: /master-css-manifest/` rules.
- Playground validation for integration behavior.

## Dangerous Changes

- Hiding request-time limitations behind build-time behavior.
- Making static mode rely on `nextConfig.webpack` or `@master/css-webpack`.
- Broadening JS loader rules beyond manifest-import handling.
- Reintroducing React tree wrappers for automatic runtime injection.

## Validation

```sh
pnpm --filter @master/css-next test
pnpm --filter @master/css-next lint
pnpm --filter @master/css-next type-check
pnpm --filter @master/css-next build
```

Run `pnpm --filter @master/css-next e2e` and build `packages/next/playground` when integration behavior changes.
