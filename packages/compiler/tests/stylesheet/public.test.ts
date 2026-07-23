import { describe, expect, test } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import {
  compileStylesheet,
  createStylesheetCollection,
  resolveStylesheet
} from '@master/css-compiler/stylesheet'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

describe('@master/css-compiler/stylesheet public contract', () => {
  test('returns immutable high-level resolution and compilation values', async () => {
    const resolution = await resolveStylesheet(
      '/project/app.css',
      '@master entry;\n.card { color: red; }'
    )
    const compilation = await compileStylesheet(
      '/project/app.css',
      '@master entry;\n.card { color: red; }',
      { baseManifest: defaultManifest }
    )

    expect(resolution?.kind).toBe('entry')
    expect(Object.isFrozen(resolution)).toBe(true)
    expect(Object.isFrozen(resolution?.dependencies)).toBe(true)
    expect(Object.isFrozen(compilation)).toBe(true)
    expect(compilation).not.toHaveProperty('manifestInput')
    expect(compilation).not.toHaveProperty('styleDefinitions')
  })

  test('encapsulates source state and disposes idempotently', async () => {
    const scanner = new MasterCSSScanner({ manifest: defaultManifest }, '/project')
    const stylesheets = createStylesheetCollection()
    await scanner.init()
    try {
      await stylesheets.register(
        scanner,
        '/project/app.css',
        '@master entry;\n.card { color: red; }',
        { baseManifest: defaultManifest }
      )
      const snapshot = stylesheets.snapshot()
      const composition = await stylesheets.compose({
        scanner,
        baseManifest: defaultManifest
      })

      expect(snapshot.sourceIds).toEqual(['/project/app.css'])
      expect(Object.isFrozen(snapshot)).toBe(true)
      expect(Object.isFrozen(snapshot.sources)).toBe(true)
      expect(Object.isFrozen(snapshot.sources[0].dependencies)).toBe(true)
      expect(Object.isFrozen(composition)).toBe(true)
      expect(Object.isFrozen(composition.emittedGlobals.variables)).toBe(true)
    } finally {
      await scanner.dispose()
      stylesheets.dispose()
      stylesheets.dispose()
    }
    expect(() => stylesheets.snapshot()).toThrow('disposed')
  })

  test('honors an aborted compile request before creating backend work', async () => {
    const controller = new AbortController()
    controller.abort(new Error('cancelled'))
    await expect(compileStylesheet('/project/app.css', '', {
      baseManifest: defaultManifest,
      signal: controller.signal
    })).rejects.toThrow('cancelled')
  })
})
