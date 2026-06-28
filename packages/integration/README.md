# @master/css-integration

Shared Master CSS integration contracts and virtual module protocols.

## Installation

```bash
npm install @master/css-integration
```

## Responsibility

`@master/css-integration` is adapter-neutral glue for official build and framework integrations. It owns virtual module IDs, `?master-css-manifest` request helpers, generated manifest and emittedGlobals module source helpers, ambient client declarations, and explicit Node helper subpaths.

It does not implement project manifest discovery, CSS import graph resolution, extraction, runtime hydration, browser runtime boot code, or framework lifecycle behavior.

## Public subpaths

| Subpath | Purpose |
| --- | --- |
| `@master/css-integration` | Shared browser-safe contracts. |
| `@master/css-integration/client` | Ambient TypeScript declarations for virtual modules. |
| `@master/css-integration/module` | General virtual module helpers. |
| `@master/css-integration/manifest-module` | Manifest virtual module IDs, query helpers, and JSON helpers. |
| `@master/css-integration/manifest-facade` | Generated manifest facade source helpers. |
| `@master/css-integration/style-module` | Generated style module helpers. |
| `@master/css-integration/emitted-globals-module` | Generated emittedGlobals module helpers. |
| `@master/css-integration/node` | Node filesystem/path helpers. |

## Client types

Add the client type reference when TypeScript imports Master CSS virtual modules:

```ts
/// <reference types="@master/css-integration/client" />
```

This declares modules such as `virtual:master-css-manifest`, `virtual:master-css-emitted-globals`, generated CSS modules, and `?master-css-manifest` imports.
