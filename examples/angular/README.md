# Master CSS Angular example

This example combines Angular server rendering with the Master CSS browser runtime. `server.ts` passes rendered HTML to `renderHTML()` from `@master/css-server` and injects the hydration manifest. `src/main.ts` starts `MasterCSSRuntime` with the default compiled program and observes class changes.

## Run the example

Install and build the workspace packages from the repository root, then start Angular:

```sh
bun install --frozen-lockfile
bun run build
cd examples/angular
bun run start
```

Open the URL printed by Angular, normally `http://localhost:4200`. Use the production server to exercise the custom `server.ts` rendering path.

## Build and verify

```sh
bun run build
bun run start:ssr
```

The production server listens on `http://localhost:4000` by default, or the port set in `PORT`. Inspect the response HTML for the generated Master CSS stylesheet and hydration manifest, then confirm that browser class changes receive styles.

Run `bun run test` for the configured Karma unit tests. No end-to-end test runner is configured.

See the [Angular installation guide](https://rc.css.master.co/guide/installation/angular) for application setup options.
