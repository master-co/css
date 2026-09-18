import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { expect, test } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { transformStylesheet } from '../src/stylesheet/public'

const baseManifest = defaultManifestJSON as unknown as MasterCSSManifest

test('host can explicitly deliver an already transformed native graph with original resource owners', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'native-host-transform-')))
  try {
    const entry = join(root, 'entry.css'), child = join(root, 'child.css'), image = join(root, 'pixel.svg')
    writeFileSync(child, '@import "https://external.test/style.css";.scoped_child{padding:2rem;background:url("./pixel.svg?v=1#part")}')
    writeFileSync(image, '<svg xmlns="http://www.w3.org/2000/svg"/>')
    const source = '@import "./child.css" layer(guard) supports(display:grid);.scoped_root{display:block}'
    const result = await transformStylesheet(entry, source, { baseManifest, projectDir: root, transformNativeStylesheets: true, delivery: {
      entryURL: '/out/root.css', stylesheetURL: file => '/out/' + basename(file), resourceURL: file => '/assets/' + basename(file)
    } })
    expect(result.transformed).toBe(true)
    expect(result.code).toContain('layer(guard)')
    const css = result.stylesheets?.find(asset => asset.id === child)?.css
    expect(css).toContain('.scoped_child')
    expect(css).toContain('https://external.test/style.css')
    expect(css).toContain('/assets/pixel.svg?v=1#part')
    expect(result.resources).toEqual([{ file: image, href: '/assets/pixel.svg' }])
    expect(result.dependencies).toEqual(expect.arrayContaining([entry, child, image]))
    expect(Object.isFrozen(result.stylesheets)).toBe(true)
    const withoutDelivery = await transformStylesheet(entry, source, { baseManifest, transformNativeStylesheets: true })
    expect(withoutDelivery.transformed).toBe(false)
    expect(withoutDelivery.code).toBe(source)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
