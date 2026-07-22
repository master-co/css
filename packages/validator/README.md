# @master/css-validator

Validate Master CSS classes through Rust-generated rule IR and a host CSS oracle.

## Installation

```bash
npm install @master/css-validator
```

## API

```ts
import { createValidator } from '@master/css-validator'

const validator = await createValidator(manifest)
const result = validator.generate([
  'text:center',
  'love:css'
])
validator.dispose()
```

Validation is batched in two stages. Rust matches classes and generates candidate rule
IR. The TypeScript platform shell checks native CSS support through the host validator,
then Rust returns the final matched/rule classification. The package does not construct
or accept a legacy engine object.

Use the native-only synchronous entry in Node:

```ts
import { createValidatorSync } from '@master/css-validator/node'

const validator = createValidatorSync(manifest)
```

The universal factory prefers native and falls back to `wasm-tooling`. A missing native
artifact from the synchronous entry is an explicit backend error, never a TypeScript
semantic fallback.
