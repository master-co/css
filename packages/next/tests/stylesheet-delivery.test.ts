import { mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test } from 'vitest'
import type { MasterCSSStylesheetDeliveryOptions } from '@master/css-compiler/stylesheet'
import { deliverNextStylesheet } from '../src/stylesheet-delivery'

const roots: string[] = []
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

test('publishes a stylesheet graph from one compilation, named by its revision', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-next-delivery-')))
  roots.push(root)
  const file = join(root, 'globals.css')
  let compilations = 0
  const compile = async (delivery: MasterCSSStylesheetDeliveryOptions) => {
    compilations++
    const child = delivery.stylesheetURL(join(root, 'child.css'))
    const css = `@import "${child}";\n.entry{color:red}`
    const sourceMap = JSON.stringify({ version: 3, sources: [file], names: [], mappings: ';AAAA' })
    return Object.defineProperty({
      entry: file, css, sourceMap, resources: [],
      stylesheets: [
        { id: file, href: delivery.entryURL, css, sourceMap },
        { id: join(root, 'child.css'), href: child, css: '.child{color:blue}', sourceMap }
      ]
    }, 'diagnostics', { enumerable: true, get() { throw new Error('Diagnostics are computed only when read.') } })
  }
  const result = await deliverNextStylesheet(file, root, () => {}, compile)
  expect(compilations).toBe(1)
  const [directory] = readdirSync(join(root, '.master/stylesheets'))
  const files = readdirSync(join(root, '.master/stylesheets', directory)).sort()
  const [revision] = files[0].match(/^[0-9a-f]{64}-/)!
  expect(files.every(name => name.startsWith(revision))).toBe(true)
  const entry = readFileSync(join(root, '.master/stylesheets', directory, `${revision}entry.css`), 'utf8')
  expect(entry).toContain(`@import "./${revision}`)
  expect(entry).not.toContain('xxxx')
  expect(result.css).toBe(`@import ".master/stylesheets/${directory}/${revision}entry.css";`)
  expect(() => (result as { diagnostics?: unknown }).diagnostics).toThrow('only when read')
})
