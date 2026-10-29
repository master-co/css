import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { compileRenderedStylesheet, transformStylesheet } from '@master/css-compiler/stylesheet'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

test('optionally preserves unchanged native text while keeping the default delivery contract', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-native-passthrough-'))
  const baseManifest: MasterCSSManifest = { version: 6, languageVersion: 16 }
  const source = '/* native */\n.card { color: var(--foreign); background: url("./pixel.svg") }'
  writeFileSync(join(root, 'pixel.svg'), '<svg/>')
  const options = {
    baseManifest, projectDir: root, transformNativeStylesheets: true,
    delivery: { entryURL: '/entry.css', stylesheetURL: () => '/source.css', resourceURL: () => '/pixel.svg' }
  }
  try {
    expect((await transformStylesheet(join(root, 'card.css'), source, { ...options, transformNativeStylesheets: false })).dependencies).toEqual([])
    expect((await transformStylesheet(join(root, 'card.css'), source, options)).transformed).toBe(true)
    const preserved = await transformStylesheet(join(root, 'card.css'), source, { ...options, preserveUnchangedNativeCSS: true })
    expect(preserved.transformed).toBe(false)
    expect(preserved.code).toBe(source)
    expect(preserved.dependencies).toContain(join(root, 'card.css'))

    writeFileSync(join(root, 'child.css'), '.child{background:url("@images/child.svg")}')
    const aliasedSource = '@import "./child.css";.card{background:url("@images/card.svg")}'
    const aliased = await transformStylesheet(join(root, 'alias.css'), aliasedSource, { ...options, preserveUnchangedNativeCSS: true,
      delivery: { ...options.delivery, resourceURL: () => { throw Error('Host-owned asset must not be published') } } })
    expect(aliased.transformed).toBe(false)
    expect(aliased.code).toBe(aliasedSource)
    expect(aliased.dependencies).toContain(join(root, 'child.css'))

    const nativeKeyframes = '@keyframes local{to{opacity:1}}.card{animation:local 1s}'
    expect((await transformStylesheet(join(root, 'keyframes.css'), nativeKeyframes, { ...options, preserveUnchangedNativeCSS: true })).code).toBe(nativeKeyframes)

    const context = await compileRenderedStylesheet(join(root, 'tokens.css'), '@theme {--paint:red}@keyframes pop{to{opacity:.5}}', { baseManifest })
    const managed = await transformStylesheet(join(root, 'card.css'), '.card{color:var(--paint)}', { ...options, baseManifest: context.manifest, preserveUnchangedNativeCSS: true })
    expect(managed.transformed).toBe(true)
    expect(managed.code).toContain('--paint:red')
    writeFileSync(join(root, 'reference.css'), '@theme{--paint:blue}')
    const unusedReference = await transformStylesheet(join(root, 'reference-native.css'), '.card{color:red}', { ...options, referenceFiles: [join(root, 'reference.css')], preserveUnchangedNativeCSS: true })
    expect(unusedReference.transformed).toBe(false)
    expect(unusedReference.code).toBe('.card{color:red}')
    expect(unusedReference.dependencies).toContain(join(root, 'reference.css'))
    const referenced = await transformStylesheet(join(root, 'reference-card.css'), '.card{color:var(--paint)}', { ...options, referenceFiles: [join(root, 'reference.css')], preserveUnchangedNativeCSS: true })
    expect(referenced.transformed).toBe(true)
    expect(referenced.code).toContain('--paint:blue')
    const animation = await transformStylesheet(join(root, 'animation.css'), '.card{animation:pop 1s}', { ...options, baseManifest: context.manifest, preserveUnchangedNativeCSS: true })
    expect(animation.transformed).toBe(true)
    expect(animation.code).toContain('@keyframes pop')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
