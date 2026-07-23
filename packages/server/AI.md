# AI Notes For `@master/css-server`

## Responsibility

`@master/css-server` renders required CSS from HTML.

## Owns

- HTML parsing for server rendering.
- HTML class collection inputs for Rust render sessions.
- Rust render-session orchestration and hydration/resource IR mapping.
- Injection or update of `<style id="master-css">`.

## Does Not Own

- Engine CSS generation semantics.
- Runtime hydration or DOM observation.
- Static source scanning.
- Framework adapter lifecycle.

## Public Surface

- `renderHTML`
- `createServerRenderer` / `MasterCSSServerRenderer`
- `createHTMLRenderSession` / `MasterCSSHTMLRenderSession`

Results are immutable snapshots. The HTML parser, DOM representation, native render
session, and live CSS state are internal.

## Key Files

- `src/render.ts`
- `src/render-html.ts`
- `src/render.ts`
- `src/html-render-session.ts`
- `src/create-server-renderer.ts`
- `src/parse-html.ts` (internal)

## Risk Areas

- HTML entity decoding in class names.
- Existing `style#master-css` replacement.
- Injecting into documents without `<head>` or `<html>`.
- Serialization preserving source expectations.
- Fixture `generated.css` output changes.

## Safe Changes

- HTML parsing fixes.
- Entity decoding fixes.
- Style injection fixes with fixtures.

## Dangerous Changes

- Changing engine CSS generation behavior here.
- Emitting unsorted CSS.
- Injecting duplicate `style#master-css` tags.
- Replacing parser/serializer without a clear reason.
- Treating `className` as HTML class without a requirement.

## Validation

```sh
pnpm --filter @master/css-server test
pnpm --filter @master/css-server lint
pnpm --filter @master/css-server type-check
pnpm --filter @master/css-server build
```

Fixture output lives in `tests/fixtures/**/generated.css`; update it only for intentional output changes.
