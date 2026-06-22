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
import { MasterCSS } from '@master/css-engine'

const css = MasterCSS.create({ manifest })

css.add('text:center', 'font:semibold')
console.log(css.text)
```

| API | Description |
| --- | --- |
| `MasterCSS.create({ manifest, emittedGlobals })` | Creates a `MasterCSS` instance. |
| `css.add(...classNames)` | Adds class names and generated rules. |
| `css.remove(...classNames)` | Removes class names and unused rules. |
| `css.createRule(className)` | Creates one generated rule without inserting it. |
| `css.createRules(className)` | Creates all generated rule branches without inserting them. |
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
