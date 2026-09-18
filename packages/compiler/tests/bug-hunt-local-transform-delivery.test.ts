import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { expect, test } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { transformStylesheet } from '../src/stylesheet/public'

const baseManifest = defaultManifestJSON as unknown as MasterCSSManifest
test.each([false, true])('BH-0004 local transform delivers imported compose with host resolver=%s', async custom => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'local-transform-')))
  const entry = join(root, 'entry.css'), child = join(root, 'child.css'), pixel = join(root, 'pixel.svg')
  try {
    writeFileSync(child, '@import "https://external.test/style.css";@utilities{paint{color:blue}}.child{@compose p:2rem;background:url(pixel.svg?q=1#part)}')
    writeFileSync(pixel, '<svg/>')
    const source = `@import "${custom ? 'child-alias' : './child.css'}" layer(guard) supports(display:grid);.root{@compose block paint;}`
    const result = await transformStylesheet(entry, source, { baseManifest, projectDir: root, delivery: {
      entryURL: '/assets/entry.css', stylesheetURL: file => '/assets/' + basename(file), resourceURL: () => '/assets/pixel.svg',
      ...(custom ? { resolveImport: async (specifier: string) => specifier === 'child-alias' ? child : undefined } : {})
    } })
    expect(result.code).toContain('layer(guard)')
    expect(result.code).toContain('display:block')
    expect(result.code).toContain('color:#00f')
    expect(result.stylesheets?.[0].css).toContain('padding:2rem')
    expect(result.stylesheets?.[0].css).toContain('https://external.test/style.css')
    expect(result.stylesheets?.[0].css).toContain('/assets/pixel.svg?q=1#part')
    expect(result.stylesheets?.[0].css).not.toContain('@compose')
    expect(result.code).not.toContain('@compose')
    expect(result.dependencies).toEqual(expect.arrayContaining([entry, child, pixel]))
    expect(result.resources).toEqual([{ file: pixel, href: '/assets/pixel.svg' }])
    expect(Object.isFrozen(result.stylesheets)).toBe(true)
    expect(Object.isFrozen(result.stylesheets?.[0])).toBe(true)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test.each([false, true])('BH-0004 local graph keeps reference globals and deduplicates published globals=%s', async published => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'local-reference-')))
  const entry = join(root, 'entry.css'), reference = join(root, 'reference.css')
  try {
    writeFileSync(reference, '@theme{--spacing-local:3rem}@utilities{pad{padding:var(--spacing-local)}}.never{color:red}')
    const result = await transformStylesheet(entry, '@reference "./reference.css";.root{@compose pad;}', { baseManifest, projectDir: root,
      emittedGlobals: published ? { variables: { 'spacing-local': 1 }, animations: {} } : undefined,
      delivery: { entryURL: '/entry.css', stylesheetURL: file => '/' + basename(file), resourceURL: file => '/' + basename(file) }
    })
    expect(result.code).toContain('padding:var(--spacing-local)')
    expect(result.code.includes('--spacing-local:3rem')).toBe(!published)
    expect(result.code).not.toContain('.never')
    expect(result.code).not.toContain('@reference')
    expect(result.dependencies).toContain(reference)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
