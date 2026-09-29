import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { createEngineSync } from '@master/css/node'
import { loadProjectManifest } from '@master/css-compiler/project'
import { flattenMasterCSSManifestVariables, serializeMasterCSSManifest, type MasterCSSManifest } from '@master/css-schema/manifest'
import { validateClassNames } from '@master/css-tooling/validator'
import { createToolingSession } from '@master/css-tooling'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { inspectProject } from '../examples/inspect-project'

test('public project, codec, query and validation APIs preserve execution context', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-public-contract-'))
  try {
    writeFileSync(join(root, 'app.css'), `@import "@master/css";
@theme { :root { --color-brand: red; } }
@theme { :root { --paint-brand: var(--color-brand); } }
@mixin --paint(--name <string>) { color: var(ident("--paint-" var(--name))); }
`)
    const project = await loadProjectManifest({
      root,
      entries: [join(root, 'app.css')],
      baseManifest: {
  "version": 4 as const,
  "languageVersion": 7 as const
}
    })
    const manifest: MasterCSSManifest = JSON.parse(serializeMasterCSSManifest(project.manifest))
    expect(flattenMasterCSSManifestVariables(manifest.variables).map(token => token.name)).toContain('color-brand')
    using original = createEngineSync({ manifest: project.manifest })
    using reloaded = createEngineSync({ manifest })
    const classNames = ['paint-brand', 'color:red', 'padding:red', 'width:var(--dynamic)', 'ordinary-card']
    const validation = await validateClassNames(classNames, { manifest })
    for (const result of validation.classes) {
      const inspected = original.inspect(result.className)
      expect(reloaded.inspect(result.className)).toEqual(inspected)
      expect(result.matchStatus).toBe(inspected.matchStatus)
      expect(result.browserSupport).toBe('not-checked')
    }
    expect(validation.classes.find(item => item.className === 'padding:red')).toMatchObject({
      matchStatus: 'matched', cssValueStatus: 'invalid'
    })
    expect(validation.classes.find(item => item.className === 'width:var(--dynamic)')).toMatchObject({
      matchStatus: 'matched', cssValueStatus: 'unknown'
    })
    expect(validation.classes.find(item => item.className === 'ordinary-card')?.matchStatus).toBe('unmatched')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('canonical suggestions do not replace raw display with a different cascade identity', async () => {
  using tooling = await createToolingSession({ manifest: defaultManifest as unknown as MasterCSSManifest })
  expect(tooling.canonicalClassNames(['display:block', "display:flex"])).toEqual([])
})

test('public inspection example distinguishes an empty result, validation states and a failed project', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-public-example-'))
  try {
    writeFileSync(join(root, 'app.css'), '@import "@master/css"; @theme { :root { --color-brand: red; } }')
    const empty = await inspectProject(root, 'app.css', [])
    expect(empty).toMatchObject({ status: 'ready', tokens: expect.arrayContaining(['color-brand']), classes: [], diagnostics: [] })

    const report = await inspectProject(root, 'app.css', ['color:red', 'padding:red', 'ordinary-card'])
    expect(report.status).toBe('ready')
    if (report.status !== 'ready') throw new Error('Expected a loaded project')
    expect(report.classes.map(item => item.inspection.matchStatus)).toEqual(['matched', 'matched', 'unmatched'])
    expect(report.classes.map(item => item.validation.cssValueStatus)).toEqual(['valid', 'invalid', 'not-checked'])

    writeFileSync(join(root, 'app.css'), '@import "@master/css"; @settings { root-size: 16; }')
    const failure = await inspectProject(root, 'app.css', ['color:red'])
    expect(failure).toMatchObject({ status: 'error' })
    expect(failure).not.toHaveProperty('classes')
    expect(failure).not.toHaveProperty('tokens')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
