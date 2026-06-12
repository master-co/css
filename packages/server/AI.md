# AI Notes For `@master/css-server`

## Responsibility

`@master/css-server` renders required CSS from HTML. It parses HTML, extracts class names, creates a `MasterCSS` instance, adds classes, and injects or updates `<style id="master">`.

## Inputs And Outputs

- Input: HTML string and optional MasterCSSPlan.
- Output: rendered HTML, optional `MasterCSS` instance, extracted classes, parsed DOM nodes, style/head/html elements.

## Public APIs

- `render`
- `renderCSS`
- `parseHTML`

## Core Files

- `src/render.ts`
- `src/render-css.ts`
- `src/parse-html.ts`
- `src/decode-html.ts`

## Allowed Changes

- HTML parsing fixes.
- Entity decoding fixes.
- Style injection behavior fixes with fixtures.

## Forbidden Without Explicit Request

- Changing engine CSS generation behavior here.
- Changing `style#master` identity casually.
- Replacing parser/serializer without a clear reason.

## Risk Areas

- HTML entity decoding in class names.
- Existing `style#master` replacement.
- Injecting into documents without `<head>` or `<html>`.
- Serialization preserving source expectations.

## Required Tests

```sh
pnpm --filter @master/css-server test
pnpm --filter @master/css-server type-check
pnpm --filter @master/css-server build
```

Fixture output lives in `tests/fixtures/**/generated.css`. Update only for intentional output changes.
End-to-end rendering cases live in package-local `e2e/**`.

## Good Changes

- Add a fixture for an encoded class attribute.
- Fix missing `<head>` insertion and test the HTML structure.

## Dangerous Changes

- Emitting unsorted CSS.
- Injecting duplicate `style#master` tags.
- Treating `className` as HTML class in server HTML parsing without a clear requirement.
