# Contributing to Master CSS
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
import { createCSS } from '../src'

it('should generated with `background-color:` instead of `background:`', () => {
  expect(createCSS().create('bg:red')?.declarations).toStrictEqual({ 'background-color': '#d11a1e' })
})

it('should contain the `:hover` selector', () => {
  expect(createCSS().create('fg:white:hover')?.text).toBe('.f\\:white\\:hover:hover{color:#ffffff}')
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
Follow the [Aronrepo conventional commits](https://github.com/1aron/aronrepo/tree/main/packages/conventional-commits). Commit headers use `Type(Scope): Summary`, with PascalCase types, optional scopes, sentence case, and no trailing period.
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
