# @master/css-engine

The manifest-driven Master CSS engine.

## Installation

```bash
npm install @master/css-engine
```

## Responsibility

`@master/css-engine` executes `MasterCSSManifest` values. It owns class matching, value parsing, selector and at-rule parsing/generation, variable and animation insertion, cascade layers, rule priority sorting, hydration manifest generation, CSS text emission, and built-in key/namespace registries.

This package does not discover project files, resolve CSS imports, compile CSS directives, or integrate with frameworks.

## API

### `MasterCSS`

```ts
import { MasterCSS, createCSS } from '@master/css-engine'

const css = createCSS(manifest)
const customCSS = new MasterCSS(manifest)

css.add('text:center', 'font:semibold')
console.log(css.text)
```

| API | Description |
| --- | --- |
| `createCSS(manifest, emittedGlobals?)` | Creates a `MasterCSS` instance. |
| `new MasterCSS(manifest, options?)` | Creates an engine instance directly. |
| `css.add(...classNames)` | Adds class names and generated rules. |
| `css.delete(...classNames)` | Removes class names and unused rules. |
| `css.refresh(manifest?)` | Refreshes with a compiled manifest. |
| `css.reset()` | Clears rules and state. |
| `css.text` | Generated CSS text. |

### Compiler helpers

`@master/css-engine/compiler` exposes parse, generate, inspect, and built-in registry helpers used by the compiler, language tooling, docs, and tests.

```ts
import {
    builtinKeyAliases,
    builtinNativeValueNamespaces,
    compareRulePriority,
} from '@master/css-engine/compiler'
```

## Related packages

- `@master/css` is the public facade over this package and the default preset.
- `@master/css-compiler` lowers CSS directives into manifests.
- `@master/css-runtime` runs the engine against live browser DOM roots.
