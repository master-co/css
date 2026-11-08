import { tmpdir } from 'node:os'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, type InlineConfig } from 'vite'
import { afterEach, expect, test } from 'vitest'
import masterCSS from '../../src/core'
import { convertTargets } from '../../src/utils/finalize-css'

const roots: string[] = []
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

const stylesheet = [
  '@import "@master/css";',
  '.card {',
  '  color: light-dark(#111, #eee);',
  '  user-select: none;',
  '}',
  ''
].join('\n')

async function buildCSS(config: Pick<InlineConfig, 'build' | 'css'>) {
  const tmpRoot = join(tmpdir(), 'master-css-vite-fixtures')
  mkdirSync(tmpRoot, { recursive: true })
  const root = mkdtempSync(join(tmpRoot, 'master-css-vite-finalize-'))
  roots.push(root)
  mkdirSync(join(root, 'src'), { recursive: true })
  mkdirSync(join(root, 'node_modules/@master'), { recursive: true })
  symlinkSync(fileURLToPath(new URL('../../../css', import.meta.url)), join(root, 'node_modules/@master/css'), 'dir')
  writeFileSync(join(root, 'index.html'), '<main class="card p-md"></main><script type="module" src="/src/main.ts"></script>')
  writeFileSync(join(root, 'src/main.ts'), 'import "./style.css"\n')
  writeFileSync(join(root, 'src/style.css'), stylesheet)
  const warnings: string[] = []
  await build({
    root, configFile: false, logLevel: 'silent', plugins: [masterCSS({ mode: 'static', runtime: false })], ...config,
    build: { outDir: 'dist', emptyOutDir: true, ...config.build, rolldownOptions: { onwarn: warning => { warnings.push(warning.message) } } }
  })
  const assets = join(root, 'dist/assets')
  const files = readdirSync(assets).filter(file => file.endsWith('.css'))
  return { files, css: files.map(file => readFileSync(join(assets, file), 'utf8')).join('\n'), warnings }
}

test('lowers and minifies the spliced stylesheet with build.cssTarget like the rest of Vite CSS', async () => {
  const { css, files } = await buildCSS({ build: { cssTarget: ['safari15'] } })
  expect(css).toContain('.p-md{')
  expect(css).not.toContain('light-dark(')
  expect(css).toContain('-webkit-user-select:none')
  expect(css).not.toMatch(/\n\s/)
  // The file name is the hash of the bytes it carries.
  expect(files).toHaveLength(1)
})

test('keeps native syntax the build target supports and still minifies', async () => {
  const { css } = await buildCSS({ build: { cssTarget: ['chrome130', 'safari18'] } })
  expect(css).toContain('light-dark(#111,#eee)')
  expect(css).not.toMatch(/\n\s/)
})

test('cssMinify: false leaves the compiled stylesheet unminified, as Vite does', async () => {
  const { css } = await buildCSS({ build: { cssMinify: false, cssTarget: ['safari15'] } })
  expect(css).toContain('light-dark(#111, #eee)')
})

test('css.transformer lightningcss lowers without minifying when cssMinify is false', async () => {
  const { css } = await buildCSS({ css: { transformer: 'lightningcss' }, build: { cssMinify: false, cssTarget: ['safari15'] } })
  expect(css).not.toContain('light-dark(')
  expect(css).toMatch(/\n\s/)
})

test('converts esbuild targets like Vite', () => {
  expect(convertTargets(['chrome111', 'edge111', 'firefox114', 'safari16.4'])).toEqual({ chrome: 111 << 16, edge: 111 << 16, firefox: 114 << 16, safari: 16 << 16 | 4 << 8 })
  expect(convertTargets('es2020')).toMatchObject({ safari: 14 << 16 | 1 << 8, ios_saf: 14 << 16 | 5 << 8 })
  expect(convertTargets(['esnext', 'node20'])).toBeUndefined()
  expect(() => convertTargets('netscape4')).toThrow('Unsupported target "netscape4"')
})
