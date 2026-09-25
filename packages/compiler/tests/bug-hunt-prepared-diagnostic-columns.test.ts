import { createRequire } from 'node:module'
import { expect, test } from 'vitest'
import { prepareStylesheet, transformStylesheet, compileRenderedStylesheet } from '../src/stylesheet/index-public'

const require = createRequire(new URL('../../vite/package.json', import.meta.url))
const sass = createRequire(require.resolve('vite'))('sass')
const identity = () => ({ async compileStringAsync(css: string) { return { css } } })
for (const source of [
  '/* 😀 */ .card { @compose "block"; }',
  `$bad: '"block"'; .card { @compose #{$bad}; }`,
  '$name: "very-long-expanded-selector"; .#{$name} { @compose "block"; }'
]) test(`prepared diagnostic columns identify an original segment: ${source}`, async () => {
  const file = '/tmp/master-source-columns.scss'
  const prepared = await prepareStylesheet(file, source, { loadSass: () => sass })
  try {
    await transformStylesheet(file, prepared.source, { baseManifest: { version: 1, languageVersion: 3, utilities: [] }, sourceMap: prepared.sourceMap, loadSass: identity })
    throw new Error('Expected invalid compose')
  } catch (error: any) {
    const diagnostic = error.diagnostics[0]
    expect(diagnostic.source).toBe(file)
    const { start, end } = diagnostic.range
    expect(start.line).toBe(0);expect(end.line).toBe(0)
    expect(start.character).toBeGreaterThanOrEqual(0)
    expect(end.character).toBeLessThanOrEqual(source.length)
    const original = source.slice(start.character, end.character)
    expect(original === '"block"' || start.character === end.character).toBe(true)
    if (start.character === end.character) expect(diagnostic.notes?.join(' ')).toContain('segment')
  }
})

test('rendered root diagnostics are mapped once through the Sass source map', async () => {
  const file = '/tmp/master-root-columns.scss', source = '/* authored */\n\n\n.card{@compose "block";}'
  const prepared = await prepareStylesheet(file, source, { loadSass: () => sass })
  await expect(compileRenderedStylesheet(file, prepared.source, { baseManifest: { version: 1, languageVersion: 3, utilities: [] }, sourceMap: prepared.sourceMap, loadSass: identity })).rejects.toMatchObject({ diagnostics: [expect.objectContaining({ source: file, range: { start: expect.objectContaining({ line: 3 }), end: expect.objectContaining({ line: 3 }) } })] })
})
