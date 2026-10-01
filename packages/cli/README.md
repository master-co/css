# @master/css-cli

Generate and inspect Master CSS with the project's installed compiler.

```bash
npm install --save-dev @master/css-cli
npx @master/css-cli generate
```

Use the explicit `generate`, `lint`, `inspect` or `migrate` command. The app CSS entry starts with `@import '@master/css';`, loading the complete preset. Static generation emits CSS without a Master browser runtime. Native CSS is preserved unless pruning is explicitly enabled.

```bash
npx @master/css-cli generate 'src/**/*.{html,tsx}' --output public/master.css
npx @master/css-cli generate --watch
npx @master/css-cli lint --format json
npx @master/css-cli inspect --include-css --format json
```

Inspection reports distinguish class matching, CSS syntax, CSS values and browser support. Generated CSS is not visual verification. `--exit-code never` suppresses the diagnostic failure exit code; `--max-warnings` sets the warning threshold.

## Compare project changes

Capture the known source classes, independently resolved manifest, native stylesheets and output assets before changing a token, mixin or stylesheet:

```bash
npx @master/css-cli inspect --snapshot > before.json
# Edit the project, then compare against the saved snapshot.
npx @master/css-cli inspect --compare before.json > impact.json
```

Both options produce JSON on stdout and are mutually exclusive. Snapshots and comparison reports have independent `version: 1` contracts. `--compare` resolves its path relative to `--cwd` (the current directory by default). Invalid snapshots or failed project resolution, stylesheet compilation or extraction fail the command. Class validation errors remain comparable, so deleting a token can reveal consumers that lose their generated rules. Differences alone do not fail; run ordinary `inspect` for diagnostic exit codes.

The impact report includes changed definitions, known consumers and files, before/after rules, transitive dependencies and asset/order changes. Read `coverage` for excluded and unresolved sources. Native references are conservative at stylesheet granularity; the report does not evaluate the DOM cascade, remote stylesheets or binary resource contents. Capture uses local file URLs for asset identities.

See [CLI installation](https://rc.css.master.co/guide/installation/cli) and [AI review workflow](https://rc.css.master.co/guide/ai-coding) for project setup and review.
