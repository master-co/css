import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import { composeWebpackStylesheets } from '../src/webpack-stylesheets'
import loader from '../src/stylesheet-loader'

const viteRequire = createRequire(new URL('../../vite/package.json', import.meta.url))
const sassRequire = createRequire(viteRequire.resolve('vite'))
const sass = sassRequire('sass') as { compileStringAsync(source: string, options: object): Promise<{ css: string }> }

for (const syntax of ['scss', 'indented']) for (const explicitCompressed of [false, true]) test(`Next preserves Sass directive terminators: ${syntax}, explicitCompressed=${explicitCompressed}`, async () => {
  const root = mkdtempSync(join(tmpdir(), 'next-sass-terminators-'))
  try {
    const file = join(root, syntax === 'scss' ? 'card.module.scss' : 'card.module.sass')
    const source = syntax === 'scss' ? '@reference "./master.css";.card{@compose p:2rem;}' : '@reference "./master.css"\n.card\n  @compose p:2rem\n'
    writeFileSync(file, source);writeFileSync(join(root, 'master.css'), '@master entry;')
    const sassOptions = { loadPaths: [root], quietDeps: true, ...(explicitCompressed ? { style: 'compressed' } : {}) }
    const original = { loader: '/node_modules/next/dist/compiled/sass-loader/cjs.js', options: { sourceMap: true, implementation: sassRequire.resolve('sass'), sassOptions } }
    const rules = composeWebpackStylesheets([{ oneOf: [{ use: [{ loader: '/node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js' }, original] }] }], '/master/stylesheet-loader.js', /master-css-manifest/) as { oneOf: { use: typeof original[] }[] }[]
    const configured = rules[0].oneOf[0].use.at(-1)!.options
    const prepared = await sass.compileStringAsync(source, { ...configured.sassOptions, style: configured.sassOptions.style ?? 'compressed', syntax, url: pathToFileURL(file) })
    const css = await new Promise<string>((resolve, reject) => loader.call({
      resourcePath: file, rootContext: root, getOptions: () => ({ preprocessed: true }),
      async: () => (error: Error | null, result?: string) => error ? reject(error) : resolve(result!)
    }, prepared.css))
    expect(css).toContain('padding:2rem')
    expect(css).not.toContain('@compose')
    expect(configured.sassOptions.loadPaths).toEqual([root])
    expect(configured.sassOptions.quietDeps).toBe(true)
    expect(configured.sourceMap).toBe(true)
    expect(original.options.sassOptions.style).toBe(explicitCompressed ? 'compressed' : undefined)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('Next preserves the Sass options callback receiver and arguments', () => {
  const receiver = { marker: true }, context = { resourcePath: '/app/card.scss' }
  const original = { loader: '/node_modules/next/dist/compiled/sass-loader/cjs.js', options: { sassOptions(this: unknown, input: unknown) {
    expect(this).toBe(receiver);expect(input).toBe(context)
    return { style: 'compressed', outputStyle: 'compressed', quietDeps: true }
  } } }
  const rules = composeWebpackStylesheets([{ oneOf: [{ use: [{ loader: '/node_modules/next/dist/build/webpack/loaders/postcss-loader/src/index.js' }, original] }] }], '/master/stylesheet-loader.js', /master-css-manifest/) as { oneOf: { use: typeof original[] }[] }[]
  expect(rules[0].oneOf[0].use.at(-1)!.options.sassOptions.call(receiver, context)).toEqual({ style: 'expanded', outputStyle: 'expanded', quietDeps: true })
  expect(original.options.sassOptions.call(receiver, context).style).toBe('compressed')
})
