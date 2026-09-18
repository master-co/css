import { mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { resolveConfig } from 'vite'
import { expect, test } from 'vitest'
import { invalidatePreparedSassSources, prepareBuildSassSource } from '../../src/utils/build-sass-source'

const require = createRequire(import.meta.url)
const sassRequire = createRequire(require.resolve('vite'))
const sassDirectory = dirname(sassRequire.resolve('sass'))
const sass = sassRequire('sass')

test('imported Sass is prepared once, retains real dependencies and removes scratch files after success or failure', async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-import-preparation-')))
  try {
    mkdirSync(join(root, 'node_modules')); symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    const cacheDir = join(root, '.vite'), entry = join(root, 'style.module.css')
    const children = ['a', 'b'].map(name => join(root, `${name}.scss`))
    const partial = join(root, '_shared.scss')
    writeFileSync(partial, '.partial { color: red }')
    for (const child of children) writeFileSync(child, '@use "./shared";.item{width:probe();@compose p:1rem;}')
    writeFileSync(entry, '@import "./a.scss" layer(a);@import "./b.scss" layer(b);')
    const additionalCalls: string[] = []
    let functionCalls = 0, fail = false
    const config = await resolveConfig({ root, cacheDir, configFile: false, logLevel: 'silent', css: {
      modules: { getJSON() { if (fail) throw new Error('controlled modules callback failure') } },
      preprocessorOptions: { scss: {
        additionalData(source, file) { additionalCalls.push(file); return source },
        functions: { 'probe()': () => { functionCalls++; return new sass.SassNumber(42, 'px') } }
      } }
    } }, 'serve')
    const context = { config }, watched: string[] = []
    const first = await prepareBuildSassSource(context, entry, file => watched.push(file))
    expect(additionalCalls.sort()).toEqual([...children].sort())
    expect(functionCalls).toBe(2)
    expect(first.deps).toEqual(new Set([...children, partial]))
    expect(watched).toEqual(expect.arrayContaining([...children, partial]))
    expect(first.code).not.toContain('master-css-sass-import-')
    expect(JSON.stringify(first.map)).not.toContain('master-css-sass-import-')
    for (const [id, css] of first.moduleSources ?? []) {
      expect(id).not.toContain('master-css-sass-import-')
      expect(css).not.toContain('sourceMappingURL')
      expect(css).not.toContain('master-css:module-input-')
    }
    for (const value of first.moduleDiagnostics?.values() ?? []) expect(value.map).not.toContain('master-css-sass-import-')
    expect(readdirSync(cacheDir).filter(name => name.startsWith('master-css-sass-import-'))).toEqual([])
    expect(await prepareBuildSassSource(context, entry)).toBe(first)
    expect(functionCalls).toBe(2)
    expect(invalidatePreparedSassSources(context, partial)).toEqual([entry])
    const repeated = await prepareBuildSassSource(context, entry)
    expect(repeated.modules).toEqual(first.modules)
    expect(repeated.moduleSources).toEqual(first.moduleSources)
    expect(functionCalls).toBe(4)
    fail = true
    expect(invalidatePreparedSassSources(context, partial)).toEqual([entry])
    await expect(prepareBuildSassSource(context, entry)).rejects.toThrow('controlled modules callback failure')
    expect(functionCalls).toBe(6)
    expect(readdirSync(cacheDir).filter(name => name.startsWith('master-css-sass-import-'))).toEqual([])
    fail = false
    expect(invalidatePreparedSassSources(context, partial)).toEqual([entry])
    expect((await prepareBuildSassSource(context, entry)).moduleSources).toEqual(first.moduleSources)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
