# AI Notes For `@master/css-next`

## Responsibility

`@master/css-next` integrates Master CSS with Next.js.

## Owns

- `pre-render` mode through the Next.js Adapter API.
- `runtime` mode through the Next client instrumentation hook.
- `progressive` mode as runtime plus pre-render behavior.
- Default `static` mode through generated CSS and scanner loaders for Turbopack and Webpack.
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
- `src/static-snapshot.ts`, `src/static-cache.ts`, `src/static-queue.ts`
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

## Static Publication Invariants

- Each snapshot hashes the same raw bytes supplied to extraction. Later verification
  captures fresh bytes; a file timestamp is never publication-cache evidence.
- Publication receipts are disposable, versioned internal files. Under the project
  lock, verify the full current inventory, configuration/tool identity and every
  output digest before reuse. Cache hits must still expose complete host dependencies.
- Stylesheet collections may be retained only while entries, order, processed inputs
  and dependencies are unchanged. Explicit `@source` includes and `@reference` context conservatively rebuild
  because their discovery/lowering is not fully represented by the import inventory.
- Module notifications share work only before snapshot capture; explicit stylesheet
  inputs remain ordered. Publish assets before the entry and the receipt after it.
- Webpack root-context watching excludes publication locks, receipts, processed-input
  storage, scan logs and atomic temporary files. Generated CSS/assets and configuration
  state remain observable; do not ignore the entire `.master` directory.

## Safe Changes

- Focused adapter, static loader, or manifest loader fixes with tests.
- Turbopack loader fixes that preserve guarded `content: /master-css-manifest/` rules.
- Playground validation for integration behavior.

## Dangerous Changes

- Hiding request-time limitations behind build-time behavior.
- Making Turbopack static mode depend on Webpack or `@master/css-webpack`.
- Broadening JS loader rules beyond project-owned static scanning and manifest-import handling.
- Writing manifest data into `.next` directly. Manifest imports are tracked ESM inputs; the bundler owns their delivery URLs and chunks.
- Reintroducing React tree wrappers for automatic runtime injection.

## Validation

```sh
pnpm --filter @master/css-next test
pnpm --filter @master/css-next lint
pnpm --filter @master/css-next type-check
pnpm --filter @master/css-next build
```

Run `pnpm --filter @master/css-next e2e` and build `packages/next/playground` when integration behavior changes.
