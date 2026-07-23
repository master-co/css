# @master/css-internal-integration

Shared Master CSS integration contracts and virtual module protocols.

This repository-private package is bundled into official integrations. It is not an
installable third-party adapter surface.

## Responsibility

`@master/css-internal-integration` is adapter-neutral glue for official build and framework integrations. It owns virtual module IDs, `?master-css-manifest` request helpers, generated manifest and emittedGlobals module source helpers, and explicit Node helper subpaths.

It does not implement project manifest discovery, CSS import graph resolution, extraction, runtime hydration, browser runtime boot code, or framework lifecycle behavior.

## Internal subpaths

| Subpath | Purpose |
| --- | --- |
| `@master/css-internal-integration` | Shared browser-safe contracts. |
| `@master/css-internal-integration/module` | General virtual module helpers. |
| `@master/css-internal-integration/manifest-module` | Manifest virtual module IDs, query helpers, and JSON helpers. |
| `@master/css-internal-integration/manifest-facade` | Generated manifest facade source helpers. |
| `@master/css-internal-integration/style-module` | Generated style module helpers. |
| `@master/css-internal-integration/emitted-globals-module` | Generated emittedGlobals module helpers. |
| `@master/css-internal-integration/node` | Node filesystem/path helpers. |

Public ambient declarations for these protocols live at `@master/css/client`.
