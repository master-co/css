# Contributing to Master CSS

## Developing
Split a new terminal and run `npm run dev` in the project root to watch all packages change and build:
```bash
npm run dev
```
Split a new terminal and switch to the target directory for testing to avoid running tests from other packages:
```bash
cd packages/target
```
```bash
npm run test -- --watch
```

## Testing
```bash
npm run test
```

### Contributing your test cases
Taking the CSS project as an example, you can freely create a file like **aron.test.ts** in [packages/css/tests/contributions](https://github.com/master-co/css/tree/dev/beta/packages/css/tests/contributions) for unit testing:

```ts
import { MasterCSS } from '../src'

it('should generated with `background-color:` instead of `background:`', () => {
    expect(new MasterCSS().create('bg:red')?.declarations).toStrictEqual({ 'background-color': '#d11a1e' })
})

it('should contain the `:hover` selector', () => {
    expect(new MasterCSS().create('fg:white:hover')?.text).toBe('.f\\:white\\:hover:hover{color:#ffffff}')
})
```

Commit your tests ( and create a Pull Request ):
```bash
Add @1aron tests
```

## Linting
Follow the [Aron's ESLint Preset](https://github.com/1aron/aronrepo/tree/beta/packages/eslint-config)
```bash
npm run lint
```

To automatically fix any violations in your code:
```
npm run lint -- --fix
```

## Type Checking
```bash
npm run type-check
```

## Commit Checking
Follow the [Aron's Conventional Commits](https://github.com/1aron/aronrepo/tree/beta/packages/conventional-commits)
```bash
npm run commit-check
```

## Checking
You have to pass `npm run check` before submitting a pull request.
```bash
npm run check
```
The command includes all of the following checks:

## Building
```
npm run build
```
