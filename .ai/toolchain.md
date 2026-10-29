# Repository Toolchain

Use Bun 1.4.4 to install dependencies and run workspace scripts. The root
`packageManager`, CI setup, and `bun run check:toolchain` enforce this version.
`bun.lock` is the only maintained dependency lockfile. CI uses
`bun install --frozen-lockfile`; do not recreate pnpm workspace settings.

```sh
bun install --frozen-lockfile
bun run build
bun run test
bun run lint
bun run type-check
bun run --filter @master/css test
```

Use `bun run test` to run the repository's Vitest suites. `bun test` invokes
Bun's own runner and is used only for the existing `node:test` support suites.
Turbo still owns task ordering and caching; Cargo owns Rust compilation and parity.

## TypeScript

Repository AST tooling and core declaration generation use TypeScript 7.0.2.
The native AST/checker API is unstable, so changes to this pin require focused
AST, declaration, package-contract, and generated Reference validation.

`scripts/toolchain-policy.mjs` lists third-party packages that require TS6.
Root `packageExtensions` gives those packages the `typescript-legacy-api` npm
alias. The postinstall script creates package-local TypeScript dependencies:
Bun's peer resolver currently reuses root TS7 despite nested overrides. This
is an installation boundary, not a module-loader interception or semantic fallback.
The root compiler remains TS7; never import the legacy API in repository source.
Angular and Svelte framework workspaces retain their upstream-required TS6 checks.

The local DTS patch accepts the common root of imported workspace sources,
keeps declarations inside its temporary output, and propagates compiler failures.
The local `sv/testing` patch installs temporary test workspaces with Bun.

## Node Exceptions

Node 24 remains the consumer compatibility baseline. These development operations
also explicitly use Node:

- TS7 synchronous API users: package/API contract checks, site preparation,
  Reference generation/tests, documentation example tests, translation audits,
  and create/VS Code test suites.
  Bun lacks the child-process pipe handles that TS7's synchronous client reads.
- LLMS content generation/tests and island tests use Node's `module.registerHooks`
  for asset imports. Homepage semantic tests also use the supported Node test host.
- Internal dynamic-module tests and the compiler/CLI/Next/Nuxt/Vite/Webpack suites:
  Bun differs in data-URL module imports, native TypedArray references, source maps,
  filesystem globs, and `module.stripTypeScriptTypes`. Build and task orchestration
  still run through Bun; these suites exercise their supported Node hosts.
- semantic-release, npm publication/provenance, VSCE/Open VSX, and native consumer smoke.
- Benchmarks intentionally measuring Node hosts and Node-specific profiling tools.

Do not globally alias `node` to Bun. Package scripts select Bun explicitly;
new Node exceptions need a concrete failing command and a documented reason.

Runtime `e2e` forwards Playwright arguments through `scripts/test-browsers.mjs`.
On macOS it uses a temporary Firefox application descriptor to isolate Gecko's
application data; personal browser profiles and installed browser files are untouched.

## Publication

The private workspace release adapter reuses the existing release library's public
authentication and version APIs; its pnpm execution hooks are never configured.
All release workspace versions are updated before any package is packed. Bun
packs and rewrites workspace protocols; Node/npm publishes validated tarballs
with the configured registry, channel, and provenance. Native targets precede
Wasm packages, wrappers follow, and GitHub assets are published last.

Editor packaging can install all optional platforms with
`bun install --frozen-lockfile --os='*' --cpu='*' --libc='*'`.
The root release entrypoint does not publish during development validation.
