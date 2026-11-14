import { mkdtempSync, realpathSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, expect, test } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { transformStylesheet } from '../../src/stylesheet/public'

const baseManifest: MasterCSSManifest = { version: 6, languageVersion: 18 }
const roots: string[] = []
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

/** Writes a file as if it was saved `age` seconds ago, so compilations of it may be reused. */
function write(file: string, source: string, age = 60) {
  writeFileSync(file, source)
  const time = new Date(Date.now() - age * 1000)
  utimesSync(file, time, time)
}

function project() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-reference-cache-')))
  roots.push(root)
  const tokens = join(root, 'tokens.css'), paint = join(root, 'paint.css')
  write(tokens, "@import './paint.css';")
  write(paint, '@mixin --paint { color: red; }')
  return { root, tokens, paint, card: join(root, 'card.css') }
}

const delivery = { entryURL: './entry.css', stylesheetURL: (id: string) => pathToFileURL(id).href, resourceURL: (id: string) => pathToFileURL(id).href }

for (const delivered of [false, true]) {
  test(`reused ${delivered ? 'delivered ' : ''}references follow edits and report their files`, async () => {
    const { root, tokens, paint, card } = project()
    const transform = async (source: string) => {
      const dependencies: string[] = []
      const onDependency = (file: string) => { dependencies.push(file) }
      const result = await transformStylesheet(card, source, {
        baseManifest, projectDir: root, referenceFiles: [tokens], transformNativeStylesheets: true, onDependency,
        ...(delivered ? { delivery: { ...delivery, onDependency } } : {})
      })
      return { code: result.code, dependencies: [...dependencies, ...result.dependencies] }
    }
    const first = await transform('.card { @apply --paint; }')
    expect(first.code).toMatch(/color:\s*red/)
    // Another stylesheet against the same references reads them from the first compilation.
    const second = await transform('.other { @apply --paint; }')
    expect(second.code).toMatch(/\.other\s*\{\s*color:\s*red/)
    expect(second.dependencies).toEqual(expect.arrayContaining([tokens, paint]))
    write(paint, '@mixin --paint { color: blue; }', 30)
    expect((await transform('.card { @apply --paint; }')).code).toMatch(/color:\s*blue/)
  })

  // Only delivery follows the referencing stylesheet into its references.
  if (delivered) test('a delivered reference that reads the referencing stylesheet stays a cycle', async () => {
    const { root, tokens, card } = project()
    write(card, '.card { color: red; }')
    write(tokens, "@reference './card.css';")
    const transform = () => transformStylesheet(card, '.card { color: red; }', {
      baseManifest, projectDir: root, referenceFiles: [tokens], transformNativeStylesheets: true,
      ...(delivered ? { delivery } : {})
    })
    await expect(transform()).rejects.toThrow(/Circular CSS reference/)
    await expect(transform()).rejects.toThrow(/Circular CSS reference/)
  })
}
