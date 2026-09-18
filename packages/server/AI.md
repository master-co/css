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
- `src/html-render-session.ts`
- `src/create-server-renderer.ts`
- `src/parse-html.ts` (internal)

## Risk Areas

- HTML entity decoding in class names.
- Existing `style#master-css` replacement.
- Injecting into documents without `<head>` or `<html>`.
- Serialization preserving source expectations.
- Fixture `generated.css` output changes.

## Constraints

- Keep CSS generation semantics in the engine.
- Preserve sorted CSS output.
- Update existing `style#master-css` instead of injecting duplicates.
- Replace the parser/serializer only for a demonstrated need.
- Treat `className` as HTML class only when required.

## Validation

For behavior changes, use the focused tests below. Run lint for package changes; type-check/build when types or package output change. AI-guidance-only edits need lint and the root context check.

```sh
pnpm --filter @master/css-server test
pnpm --filter @master/css-server lint
pnpm --filter @master/css-server type-check
pnpm --filter @master/css-server build
```

Fixture output lives in `tests/fixtures/**/generated.css`; update it only for intentional output changes.
