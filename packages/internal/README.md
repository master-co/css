# @master/css-internal

Private Master CSS integration kernel and virtual module protocols.

This repository-private package is bundled into official integrations. It is not an
installable third-party adapter surface or a general-purpose shared utility package.

## Responsibility

`@master/css-internal` is adapter-neutral glue for official build, framework, editor,
and tooling hosts. It owns virtual module IDs, `?master-css-manifest` request helpers,
generated manifest, emittedGlobals, and runtime-bootstrap module source, default build
manifest helpers, and explicit Node/workspace helper subpaths.

It does not implement project manifest discovery, CSS import graph resolution,
extraction, runtime hydration, DOM runtime lifecycle, compiler lowering, or framework
lifecycle behavior. New code belongs here only when multiple official hosts must bundle
the same adapter-neutral implementation and no public owning package is appropriate.

## Internal subpaths

| Subpath | Purpose |
| --- | --- |
| `@master/css-internal` | Shared browser-safe contracts. |
| `@master/css-internal/module` | General virtual module helpers. |
| `@master/css-internal/manifest-module` | Manifest virtual module IDs, query helpers, and JSON helpers. |
| `@master/css-internal/manifest-facade` | Generated manifest facade source helpers. |
| `@master/css-internal/style-module` | Generated style module helpers. |
| `@master/css-internal/emitted-globals-module` | Generated emittedGlobals module helpers. |
| `@master/css-internal/runtime-bootstrap` | Runtime bootstrap virtual IDs and generated module source. |
| `@master/css-internal/project` | Default build manifest and manifest-entry request helpers. |
| `@master/css-internal/node` | Node filesystem/path helpers. |
| `@master/css-internal/workspace` | Official-host workspace package resolution. |
| `@master/css-internal/workspace-directories` | Build workspace directory discovery. |

Public ambient declarations for these protocols live at `@master/css/client`.
