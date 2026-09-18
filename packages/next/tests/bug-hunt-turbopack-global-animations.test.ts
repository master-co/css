import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import loader from '../src/stylesheet-loader'

/** The general (Turbopack) loader path: no host PostCSS pass, Next's Module processors scope the file. */
function transform(root: string, file: string, source: string) {
  return new Promise<string>((done, reject) => loader.call({
    resourcePath: file, rootContext: root, getOptions: () => ({}), addDependency() {},
    // Turbopack resolves `composes ... from` through the loader resolver.
    getResolve: () => async (directory: string, request: string) => resolve(directory, request),
    async: () => (error: Error | null, code?: string) => error ? reject(error) : done(code!)
  }, source))
}
/** Collects the published graph the loader hands Next through relative/file `@import` hrefs. */
function graph(file: string, code: string, output = new Map<string, string>()) {
  if (output.has(file)) return output
  output.set(file, code)
  for (const [, href] of code.matchAll(/@import\s+["']([^"']+)["']/g)) if (href.startsWith('.') || href.startsWith('file:')) {
    const child = fileURLToPath(new URL(href, pathToFileURL(file)))
    graph(child, readFileSync(child, 'utf8'), output)
  }
  return output
}

test('general loader keeps global animation references unscoped and emits their keyframes for CSS Modules', async () => {
  const root = mkdtempSync(join(tmpdir(), 'next-turbopack-animations-'))
  try {
    mkdirSync(join(root, 'app'))
    const file = join(root, 'app/card.module.css')
    const child = join(root, 'app/other.module.css')
    writeFileSync(child, '.shared{border-top:7px solid red;animation:fade 1s linear infinite}')
    const source = '@master entry;@preserve native;.direct{composes:shared from "./other.module.css";color:#123456;animation:fade 1s linear infinite}@keyframes local-spin{to{transform:rotate(1turn)}}.spin{animation:local-spin 1s}'
    writeFileSync(file, source)
    const exports = await transform(root, file, source)
    // The general loader publishes the delivered graph and returns Module composes over it.
    const sheets = graph(file, exports)
    expect(sheets.size).toBeGreaterThan(1)
    const css = [...sheets.values()].join('\n')
    // Preset keyframes stay global in both Modules: the references keep their name and the keyframes are emitted once.
    // (Next's Module processors normalise the shorthand order, so only the name position is asserted.)
    expect(css.match(/animation:[^;]*\bfade;/g)).toHaveLength(2)
    expect(css.match(/@keyframes fade\b/g)).toHaveLength(1)
    expect(css).not.toMatch(/card_fade__|other_fade__/)
    // Locally defined keyframes remain Module-scoped as in plain CSS Modules.
    expect(css).toMatch(/@keyframes card_local-spin__/)
    expect(css).toMatch(/animation:[^;]*\bcard_local-spin__/)
    // Global animation names are not Module exports; local keyframes still are.
    expect(exports).not.toMatch(/\.fade\s*\{/)
    expect(exports).toMatch(/\.local-spin\s*\{/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
