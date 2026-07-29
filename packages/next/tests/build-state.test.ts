import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveMasterCSSBuildState } from '../src/build-state'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'

let fixtureDir: string | undefined

function createFixtureDir() {
  fixtureDir = mkdtempSync(join(tmpdir(), 'master-css-next-build-state-'))
  mkdirSync(join(fixtureDir, 'app'), { recursive: true })
  return fixtureDir
}

afterEach(() => {
  vi.restoreAllMocks()
  if (fixtureDir) {
    rmSync(fixtureDir, { recursive: true, force: true })
    fixtureDir = undefined
  }
})

describe('resolveMasterCSSBuildState', () => {
  it('resolves @compose entries against the loaded base manifest while extracting native CSS', async () => {
    const dispose = vi.spyOn(MasterCSSScanner.prototype, 'dispose')
    const root = createFixtureDir()
    const entry = join(root, 'app/globals.css')
    writeFileSync(entry, [
      '@import "@master/css";',
      '',
      '@theme { --color-host: #123456; }',
      '.host { color: var(--color-host); }',
      '',
      '.hidden-card {',
      '    @compose hidden;',
      '}'
    ].join('\n'))

    const result = await resolveMasterCSSBuildState(root, ['hidden-card'])

    expect(result.styleSources).toEqual([entry])
    expect(result.nativeCSS).toContain('@layer base')
    expect(result.nativeCSS).toContain('text-rendering: geometricprecision')
    expect(result.nativeCSS).toContain('.hidden-card')
    expect(result.nativeCSS).toContain('display:none')
    expect(result.emittedGlobals.variables?.['color-host']).toBe(1)
    expect(dispose).toHaveBeenCalledOnce()
  })
})
