# Contributing to Master CSS

For usage questions, ideas, and bug-report routing, see the [support guide](./SUPPORT.md).

```bash
bun install --frozen-lockfile
```

Run `bun run build` in the project root to build all packages:
```bash
bun run build
```
Split a new terminal and switch to the target directory for testing to avoid running tests from other packages:
```bash
cd packages/css
```

## Testing
```bash
bun run test --watch
```

### Contributing your test cases
Taking the CSS project as an example, create a focused `*.test.ts` file under `packages/css/tests` for unit testing:

```ts
import { expect, it } from 'vitest'
import { createEngine } from '../src'
import defaultManifest from '@master/css-preset/default-manifest.json'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const manifest = defaultManifest as unknown as MasterCSSManifest

it('uses background-color for palette backgrounds', async () => {
  using engine = await createEngine({ manifest })
  expect(engine.inspect('bg-red-60').rules.map(rule => rule.text))
    .toEqual(['.bg-red-60{background-color:var(--color-red-60)}'])
})

it('preserves the hover selector', async () => {
  using engine = await createEngine({ manifest })
  expect(engine.inspect('fg-white:hover').rules.map(rule => rule.text))
    .toEqual([String.raw`.fg-white\:hover:hover{color:var(--color-white)}`])
})
```

Commit your tests ( and create a Pull Request ):
```bash
Test(Core): Add @1aron coverage
```

## Linting
Follow the repository ESLint flat config.
```bash
bun run lint
```

To automatically fix any violations in your code:
```
bun run lint -- --fix
```

## Type Checking
```bash
bun run type-check
```

## Commit Checking
Follow the [Aronrepo commit policy](https://github.com/1aron/aronrepo/tree/main/packages/aronrepo) in [AGENTS.md](../AGENTS.md#commit-and-release-policy). Commit headers use `Type(Scope): Summary`, with PascalCase types, optional scopes, sentence case, and no trailing period. `bun x aronrepo policy` lists which types release, and `bun x aronrepo explain` shows what the next release would be.
```bash
bun run commit-check
```

## Checking
You have to pass `bun run check` before submitting a pull request.
```bash
bun run check
```
The command includes all of the following checks:

## Building
```
bun run build
```
