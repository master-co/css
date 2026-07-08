# @master/css-compiler

Compile Master CSS stylesheet directives into manifest data, native CSS, and directive metadata.

## Installation

```bash
npm install @master/css-compiler
```

## Responsibility

`@master/css-compiler` is the CSS source compiler for Master CSS. It parses CSS manifest directives such as `@settings`, `@theme`, `@custom-variant`, `@defaults`, `@components`, `@utilities`, local `@compose`, top-level extraction directives, native CSS, and CSS import graphs.

The compiler delegates class semantics and rule generation to `@master/css-engine`; project entry discovery belongs to `@master/css-project`.

## API

### Root entry

Use the root entry in Node environments when CSS imports and filesystem dependencies should be resolved.

```ts
import {
  compileCSS,
  compileCSSFile,
  compileCSSManifest,
  compileCSSManifestFile,
  compileProjectManifest,
} from '@master/css-compiler'
```

Common flows:

```ts
const result = compileCSSManifest('@theme { --color-primary: #4f46e5; }')
const fileResult = await compileCSSManifestFile('/project/src/index.css')
const projectResult = await compileProjectManifest(['/project/src/index.css'])
```

Compiler results include the compiled manifest, dependency paths, warnings, native CSS, and directive metadata used by build integrations.

### Browser entry

Use `@master/css-compiler/browser` when CSS import resolution is not needed.

```ts
import { compileCSSManifest } from '@master/css-compiler/browser'
```

The browser compiler rejects `@reference` directives because they require filesystem resolution.

## Related packages

- `@master/css-engine` executes compiled manifests.
- `@master/css-project` discovers and loads project CSS manifest entries.
- `@master/css-stylesheet` composes stylesheet entries for static rendering.
