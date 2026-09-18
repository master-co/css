import { readStylesheetEntry } from './helpers/stylesheet-output'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire, SourceMap } from 'node:module'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import loader from '../src/stylesheet-loader'

const require = createRequire(new URL('../../vite/package.json', import.meta.url))
const sassFile = createRequire(require.resolve('vite')).resolve('sass')
async function fixture(run: (root: string) => Promise<void>) {
  const root = mkdtempSync(join(tmpdir(), 'next-output-map-'))
  try { writeFileSync(join(root, 'master.css'), '@master entry;@utilities{paint{padding:2rem}}'); await run(root) }
  finally { rmSync(root, { recursive: true, force: true }) }
}
function compile(root: string, file: string, source: string, options = {}, inputMap?: object) {
  return new Promise<{ code: string, sourceMap: ConstructorParameters<typeof SourceMap>[0] }>((resolve, reject) => loader.call({
    rootContext: root, resourcePath: file, getOptions: () => options,
    async: () => (error: Error | null, code?: string, sourceMap?: object) => error ? reject(error) : resolve(readStylesheetEntry(file, code!, sourceMap as ConstructorParameters<typeof SourceMap>[0]))
  }, source, inputMap))
}
function origin(result: Awaited<ReturnType<typeof compile>>, token: string) {
  expect(result.sourceMap).toBeDefined()
  const offset = result.code.indexOf(token);expect(offset).toBeGreaterThanOrEqual(0)
  const lines = result.code.slice(0, offset).split('\n')
  return new SourceMap(result.sourceMap).findEntry(lines.length - 1, lines.at(-1)!.length)
}

test('Next injected package entry retains pure CSS authoring lines in its callback map', async () => {
  await fixture(async root => {
    const file = join(root, 'entry.css'), source = '@master entry;@utilities{paint{padding:2rem}}\n.card{@compose paint;}'
    const result = await compile(root, file, source)
    expect(origin(result, '.card')).toMatchObject({ originalSource: pathToFileURL(file).href, originalLine: 1, originalColumn: 0 })
    expect(result.sourceMap.sourcesContent).toContain(source)
  })
})
for (const syntax of ['scss', 'sass']) test(`Next ${syntax} output map retains original root after additionalData`, async () => {
  await fixture(async root => {
    const file = join(root, 'card.module.' + syntax)
    const source = syntax === 'sass' ? '.card\n  @compose paint\n' : '.card {\n  @compose paint;\n}'
    const result = await compile(root, file, source, { sassOptions: { implementation: sassFile, additionalData: syntax === 'sass' ? '$a: 1\n$b: 2' : '$a:1;\n$b:2;' } })
    expect(origin(result, '.card')).toMatchObject({ originalSource: pathToFileURL(file).href, originalLine: 0 })
    expect(origin(result, 'padding:2rem')).toMatchObject({ originalSource: pathToFileURL(file).href, originalLine: 1 })
    expect(result.sourceMap.sourcesContent).toContain(source)
  })
})
test('Next output map distinguishes imported Sass and injected CSS origins', async () => {
  await fixture(async root => {
    const file = join(root, 'card.module.scss'), child = join(root, '_card.scss')
    writeFileSync(child, '.card{@compose paint;}')
    const result = await compile(root, file, '@use "card";', { sassOptions: { implementation: sassFile, additionalData: '$gap:1;' } })
    expect(origin(result, '.card')).toMatchObject({ originalSource: pathToFileURL(child).href, originalLine: 0 })
    const injected = await compile(root, file, '.card{@compose paint;}', { sassOptions: { implementation: sassFile, additionalData: '.injected{margin:1rem}' } })
    expect(origin(injected, '.injected')).toMatchObject({ originalSource: pathToFileURL(file).href + '?master-css-additional-data', originalLine: 0 })
  })
})
test('Next preprocessed Webpack input chains the supplied Sass map through lowering', async () => {
  await fixture(async root => {
    const file = join(root, 'card.module.scss'), source = '/* original */\n.card {\n  @compose paint;\n}'
    const prepared = await require(sassFile).compileStringAsync(source, { url: pathToFileURL(file), sourceMap: true, sourceMapIncludeSources: true })
    const result = await compile(root, file, prepared.css, { preprocessed: true }, prepared.sourceMap)
    expect(origin(result, 'padding:2rem')).toMatchObject({ originalSource: pathToFileURL(file).href, originalLine: 2 })
    expect(result.sourceMap.sourcesContent).toContain(source)
  })
})
test('Next native CSS passes its existing host map through unchanged', async () => {
  await fixture(async root => {
    const file = join(root, 'plain.css'), code = '.plain{color:red}'
    const sourceMap = { version: 3, sources: [pathToFileURL(file).href], names: [], sourcesContent: [code], mappings: 'AAAA' }
    expect(await compile(root, file, code, { preprocessed: true }, sourceMap)).toEqual({ code, sourceMap })
  })
})
