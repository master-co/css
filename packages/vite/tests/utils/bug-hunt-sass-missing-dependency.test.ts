import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { resolveConfig } from 'vite'
import { expect, test } from 'vitest'
import { invalidatePreparedSassSources, prepareBuildSassSource } from '../../src/utils/build-sass-source'
const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))

test('BH-0004 a missing Sass partial retains recovery edges until a successful source removes them', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-sass-missing-edge-')))
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    const entry = join(root, 'style.scss'), partial = join(root, '_tokens.scss')
    writeFileSync(entry, '@use "./tokens";.example{color:tokens.$tone}')
    writeFileSync(partial, '$tone:red;')
    const context = { config: await resolveConfig({ root, configFile: false, logLevel: 'silent' }, 'serve') }
    expect((await prepareBuildSassSource(context, entry)).code).toContain('red')
    unlinkSync(partial)
    expect(invalidatePreparedSassSources(context, partial)).toEqual([entry])
    const dependencies: string[] = []
    await expect(prepareBuildSassSource(context, entry, file => dependencies.push(file))).rejects.toThrow()
    expect(dependencies).toContain(partial)
    writeFileSync(partial, '$tone:blue;')
    expect(invalidatePreparedSassSources(context, partial)).toEqual([entry])
    expect((await prepareBuildSassSource(context, entry)).code).toContain('blue')
    writeFileSync(entry, '.example{color:green}')
    expect(invalidatePreparedSassSources(context, entry)).toEqual([entry])
    expect((await prepareBuildSassSource(context, entry)).code).toContain('green')
    expect(invalidatePreparedSassSources(context, partial)).toEqual([])
  } finally { rmSync(root, { recursive: true, force: true }) }
})
