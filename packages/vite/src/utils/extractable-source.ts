// File extensions Vite is expected to feed through `transform`. Mirrors the
// extractor's default include glob and is the universe of files that can
// realistically contain Master CSS class strings. Limiting the transform
// hook to this allow-list avoids pumping every .json / image-as-module /
// virtual chunk through the regex-heavy `extractLatentClasses`. The trailing
// `(?:\?|$)` lets through Vite's `?import` / `?url` / `?raw` suffixes.
export const EXTRACTABLE_EXT = /\.(html|js|jsx|mjs|cjs|ts|tsx|mts|cts|svelte|astro|vue|md|mdx|pug|php)(?:\?|$)/
const STYLE_QUERY = /[?&]type=style(?:&|$)/

export function isExtractableSource(id: string) {
    return EXTRACTABLE_EXT.test(id) && !STYLE_QUERY.test(id)
}
