import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import preset from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { transformStylesheet } from '../../src/stylesheet/public'

const baseManifest = preset as unknown as MasterCSSManifest

test('separates generated globals at the compiler boundary while referenced native overrides keep separate delivery', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-global-css-'))
  const tokens = join(root, 'tokens.css')
  writeFileSync(tokens, `
    @mixin --ocean { &:where([data-theme="ocean"], [data-theme="ocean"] *) { @contents; } } @utility ocean { &:where([data-theme="ocean"], [data-theme="ocean"] *) { @contents; } }
    @theme {
  --color-probe: red;
}



[data-theme="ocean"] { --color-probe: blue; }

  `)
  const file = join(root, 'card.module.css')
  const source = '@reference "./tokens.css"; .card { color: var(--color-probe); }'
  const inline = await transformStylesheet(file, source, { baseManifest })
  const separate = await transformStylesheet(file, source, { baseManifest, generatedGlobals: 'separate' })
  expect(inline.globalStylesheet).toBeUndefined()
  expect(inline.code).toContain('--color-probe:red')
  expect(separate.code).toMatch(/\.card\s*\{\s*color:\s*var\(--color-probe\)/)
  expect(separate.code).not.toContain('--color-probe:')
  expect(separate.globalStylesheet?.css).toContain(':root,:host{--color-probe:red}')
  expect(separate.globalStylesheet?.css).not.toContain('[data-theme=ocean]')
  expect(separate.dependencies).toContain(tokens)
  expect(Object.isFrozen(separate.globalStylesheet)).toBe(true)
  expect(inline.code).toContain(separate.globalStylesheet!.css)
})

test('separation still rejects invalid local declarations atomically under strict validation', async () => {
  await expect(transformStylesheet('/project/card.module.css',
    `@theme {
  --color-probe:red;
} .card { color:var(--color-probe); width:calc(1px + 1s); }`,
    { baseManifest, generatedGlobals: 'separate', validation: 'error' }
  )).rejects.toThrow()
})

test('shared leaves the globals the base manifest renders to one host output and keeps a graph\'s own inline', async () => {
  const { loadProjectManifest } = await import('../../src/project/manifest')
  const { renderStylesheetGlobals } = await import('../../src/stylesheet/public')
  const root = mkdtempSync(join(tmpdir(), 'master-shared-globals-'))
  const entry = join(root, 'app.css')
  writeFileSync(entry, '@import "@master/css";@theme{--color-project:red;--color-other:blue}')
  const project = await loadProjectManifest({ root, entries: [entry], baseManifest })
  const delivery = { entryURL: 'https://host.test/entry.css', stylesheetURL: (file: string) => `https://host.test/${encodeURIComponent(file)}.css`, resourceURL: (file: string) => `https://host.test/r/${encodeURIComponent(file)}` }
  const options = { baseManifest: project.manifest, projectDir: root, referenceFiles: [entry], transformNativeStylesheets: true, delivery }
  const card = '.card{color:var(--color-project)}'
  const inline = await transformStylesheet(join(root, 'card.css'), card, options)
  const shared = await transformStylesheet(join(root, 'card.css'), card, { ...options, generatedGlobals: 'shared' })
  expect(inline.sharedGlobals).toBeUndefined()
  expect(inline.code).toContain('--color-project:red')
  expect(shared.sharedGlobals).toBe(true)
  expect(shared.code).toMatch(/\.card\s*\{\s*color:\s*var\(--color-project\)/)
  expect(shared.code).not.toContain('--color-project:')
  const badge = await transformStylesheet(join(root, 'badge.css'), '.badge{color:var(--color-project);background:var(--color-other)}', { ...options, generatedGlobals: 'shared' })
  const globals = renderStylesheetGlobals({ manifest: project.manifest, css: [shared.code, badge.code] })
  expect(globals.css.match(/--color-project:red/g)).toHaveLength(1)
  expect(globals.css).toContain('--color-other:blue')
  expect(Object.keys(globals.emittedGlobals.variables)).toEqual(expect.arrayContaining(['color-project', 'color-other']))
  expect(renderStylesheetGlobals({ manifest: project.manifest, css: [shared.code], emittedGlobals: globals.emittedGlobals }).css).toBe('')
  // A definition of its own, even one overriding a project token, is not the project's to emit.
  const own = await transformStylesheet(join(root, 'own.css'), '@theme{--color-project:green} .own{color:var(--color-project)}', { ...options, generatedGlobals: 'shared' })
  expect(own.sharedGlobals).toBeUndefined()
  expect(own.code).toContain('--color-project:green')
  const native = await transformStylesheet(join(root, 'plain.css'), '.plain{@media all{color:red}}', { ...options, generatedGlobals: 'shared' })
  expect(native.sharedGlobals).toBeUndefined()
})
