import { createRequire, SourceMap } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import { removeSassPrefixError, removeSassPrefixMap } from '../src/sass-source-context'

const require = createRequire(new URL('../../vite/package.json', import.meta.url))
const sass = createRequire(require.resolve('vite'))('sass')
const prefix = '$first: 1;\n$second: 2;\n'

for (const filename of ['card~name.scss', 'card #name.scss', 'card%20name.scss']) {
  test(`Sass maps subtract additional data for equivalent file URL encodings: ${filename}`, async () => {
    const url = pathToFileURL(resolve(filename)), source = '.card { color: red; }'
    const result = await sass.compileStringAsync(prefix + source, { url, sourceMap: true, sourceMapIncludeSources: true })
    const map = removeSassPrefixMap(result.sourceMap, url, source, prefix) as ConstructorParameters<typeof SourceMap>[0]
    const origin = new SourceMap(map).findEntry(0, 0)
    expect(origin).toMatchObject({ originalLine: 0, originalColumn: 0 })
    expect('originalSource' in origin && fileURLToPath(origin.originalSource)).toBe(fileURLToPath(url))
    expect(map.sourcesContent).toContain(source)
  })

  test(`Sass errors subtract additional data for equivalent file URL encodings: ${filename}`, async () => {
    const url = pathToFileURL(resolve(filename)), source = '.card { color: $missing; }'
    let failure: unknown
    try { await sass.compileStringAsync(prefix + source, { url }) }
    catch (error) { failure = error }
    expect(failure).toBeDefined()
    expect(removeSassPrefixError(failure, url, source, prefix)).toMatchObject({
      span: { url, start: { line: 0 }, text: '$missing' },
      message: expect.stringContaining(`${fileURLToPath(url)}:1:`)
    })
  })
}

test('Sass errors from a distinct virtual source keep their original location', () => {
  const url = pathToFileURL(resolve('card.scss'))
  const failure = Object.assign(new Error('virtual failure'), {
    span: { url: new URL(url.href + '?importer'), start: { line: 4 } }
  })
  expect(removeSassPrefixError(failure, url, '.card {}', prefix)).toBe(failure)
})
