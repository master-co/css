import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { expect, test } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { resolveStylesheet, transformStylesheet } from '../src/stylesheet/public'

const baseManifest = defaultManifestJSON as unknown as MasterCSSManifest
test.each([false, true])('imported local directives classify and transform a plain root with custom resolver=%s', async custom => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'imported-local-')))
  const entry = join(root, 'entry.css'), child = join(root, 'child.css'), leaf = join(root, 'leaf.css')
  try {
    writeFileSync(child, '@import "./leaf.css";.child{color:red}')
    writeFileSync(leaf, '@import "https://external.test/style.css";.leaf{@compose p:2rem;}')
    const source = `@import "${custom ? 'child-alias' : './child.css'}" layer(guard) supports(display:grid);.root{display:block}`
    const resolveImport = custom ? async (specifier: string) => specifier === 'child-alias' ? child : undefined : undefined
    const resolution = await resolveStylesheet(entry, source, { projectDir: root, preserveImports: true, resolveImport })
    expect(resolution?.kind).toBe('local')
    expect(resolution?.compilationSource).toBe(source)
    expect(resolution?.dependencies).toEqual(expect.arrayContaining([entry, child, leaf]))
    const result = await transformStylesheet(entry, source, { baseManifest, projectDir: root, delivery: {
      entryURL: '/entry.css', stylesheetURL: file => '/' + basename(file), resourceURL: file => '/' + basename(file), resolveImport
    } })
    expect(result.transformed).toBe(true)
    expect(result.stylesheets?.find(asset => asset.id === leaf)?.css).toContain('padding:2rem')
    expect(result.code).toContain('layer(guard)')
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('delivery transform leaves a wholly native graph and its host-owned resources unchanged', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'plain-imported-')))
  const entry = join(root, 'entry.css')
  try {
    writeFileSync(join(root, 'child.css'), '.child{background:url(host-owned.svg)}')
    const source = '@import "./child.css";.root{display:block}'
    const result = await transformStylesheet(entry, source, { baseManifest, projectDir: root, delivery: {
      entryURL: '/entry.css', stylesheetURL: file => '/' + basename(file), resourceURL: () => { throw new Error('Native resources belong to the host') }
    } })
    expect(result.transformed).toBe(false)
    expect(result.code).toBe(source)
    expect(result.stylesheets).toBeUndefined()
  } finally { rmSync(root, { recursive: true, force: true }) }
})
