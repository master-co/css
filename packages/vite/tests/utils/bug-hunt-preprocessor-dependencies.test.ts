import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { resolveConfig } from 'vite'
import { expect, test, vi } from 'vitest'
import { clearBuildSassSources, invalidatePreparedSassSources, prepareBuildSassSource } from '../../src/utils/build-sass-source'

const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))

for (const extension of ['css', 'scss']) test(`BH-0004 ${extension} Modules retain nested resolved dependencies without repeating preprocessing`, async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-module-dependency-')))
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    const entry = join(root, `style.module.${extension}`), child = join(root, 'shared.module.css'), leaf = join(root, 'leaf.module.css')
    writeFileSync(entry, '.example{composes:shared from "@shared";background:blue}')
    writeFileSync(child, '.shared{composes:leaf from "./leaf.module.css";color:red}')
    writeFileSync(leaf, '.leaf{font-weight:bold}')
    const getJSON = vi.fn()
    const config = await resolveConfig({ root, configFile: false, resolve: { alias: { '@shared': child } }, css: { modules: { getJSON, generateScopedName: 'scope_[local]' } } }, 'build')
    const context = { config }, dependencies: string[] = [], cachedDependencies: string[] = []
    const first = await prepareBuildSassSource(context, entry, file => dependencies.push(file))
    const cached = await prepareBuildSassSource(context, entry, file => cachedDependencies.push(file))
    expect(first.modules?.example).toBe('scope_example scope_shared scope_leaf')
    expect([...first.deps ?? []]).toEqual(expect.arrayContaining([child, leaf]))
    expect(dependencies).toEqual(expect.arrayContaining([child, leaf]))
    expect(cachedDependencies).toEqual(dependencies)
    expect(cached).toBe(first)
    expect(getJSON).toHaveBeenCalledTimes(1)
    expect(invalidatePreparedSassSources(context, join(root, 'unrelated.css'))).toEqual([])
    expect(await prepareBuildSassSource(context, entry)).toBe(first)
    writeFileSync(leaf, '.leaf{font-weight:normal}')
    expect(invalidatePreparedSassSources(context, leaf)).toEqual([entry])
    const updated = await prepareBuildSassSource(context, entry)
    expect(updated).not.toBe(first)
    expect(updated.code).toContain('font-weight:normal')
    expect(getJSON).toHaveBeenCalledTimes(2)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('BH-0004 resolved Module dependencies remain observable after a preprocessing error', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-module-error-dependency-')))
  try {
    const entry = join(root, 'style.module.css'), child = join(root, 'shared.module.css')
    writeFileSync(entry, '.example{composes:shared from "./shared.module.css"}')
    writeFileSync(child, '.shared{color:red}')
    let fail = true
    const config = await resolveConfig({ root, configFile: false, css: { modules: {
      generateScopedName: 'scope_[local]',
      getJSON() { if (fail) throw new Error('consumer callback failed') }
    } } }, 'build')
    const context = { config }, dependencies: string[] = []
    await expect(prepareBuildSassSource(context, entry, file => dependencies.push(file))).rejects.toThrow('consumer callback failed')
    expect(dependencies).toContain(child)
    writeFileSync(child, '.shared{color:blue}')
    fail = false
    clearBuildSassSources(context)
    const recovered = await prepareBuildSassSource(context, entry)
    expect(recovered.modules?.example).toBe('scope_example scope_shared')
    expect(recovered.deps).toContain(child)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
