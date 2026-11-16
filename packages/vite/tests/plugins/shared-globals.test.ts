import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build, createLogger, createServer } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

function fixture(name: string, entryImports: string) {
  const parent = join(process.cwd(), 'tmp'); mkdirSync(parent, { recursive: true })
  const root = mkdtempSync(join(parent, name))
  writeFileSync(join(root, 'app.css'), '@import "@master/css";@theme{--color-project:red;--color-unused:blue}')
  writeFileSync(join(root, 'shared.css'), '.shared{@media all{display:block}}')
  writeFileSync(join(root, 'a.css'), '@import "./shared.css";.a{color:var(--color-project)}')
  writeFileSync(join(root, 'b.css'), '@import "./shared.css";.b{background:var(--color-project)}')
  writeFileSync(join(root, 'own.css'), '@theme{--color-own:green}.own{color:var(--color-own);background:var(--color-project)}')
  writeFileSync(join(root, 'entry.js'), entryImports)
  writeFileSync(join(root, 'index.html'), '<script type="module" src="./entry.js"></script>')
  return root
}
const count = (source: string, text: string) => source.split(text).length - 1

async function buildCSS(root: string) {
  const warnings: string[] = []
  const customLogger = createLogger('warn')
  customLogger.warn = message => { warnings.push(message) }
  customLogger.warnOnce = message => { warnings.push(message) }
  const result = await build({ root, configFile: false, customLogger, plugins: masterCSS({ mode: 'static' }), build: { write: false, cssMinify: false } })
  if (Array.isArray(result) || 'on' in result) throw new Error('Expected one build output')
  const css = result.output.filter(asset => asset.type === 'asset' && asset.fileName.endsWith('.css')).map(asset => asset.type === 'asset' ? String(asset.source) : '').join('\n')
  return { css, warnings }
}

test('a build emits the project globals of every local stylesheet once, through its style entry', async () => {
  const root = fixture('shared-globals-build-', 'import "./app.css";import "./a.css";import "./b.css";import "./own.css";')
  try {
    const { css, warnings } = await buildCSS(root)
    // One for a.css and b.css in the entry; own.css defines globals of its own,
    // so it keeps every global it needs.
    expect(count(css, '--color-project:red')).toBe(2)
    expect(css).not.toContain('--color-unused')
    expect(css).toContain('--color-own:green')
    expect(css).toMatch(/\.a\s*\{\s*color:\s*var\(--color-project\)/)
    expect(css).toMatch(/\.b\s*\{\s*background:\s*var\(--color-project\)/)
    const duplicated = warnings.filter(message => message.includes('is delivered once in each stylesheet'))
    expect(duplicated).toHaveLength(1)
    expect(duplicated[0]).toContain('shared.css')
    expect(duplicated[0]).toContain('a.css')
    expect(duplicated[0]).toContain('b.css')
    expect(count(css, '.shared')).toBe(2)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('a build without a delivered style entry leaves each local stylesheet its globals', async () => {
  const root = fixture('shared-globals-no-entry-', 'import "./a.css";import "./b.css";')
  try {
    const { css } = await buildCSS(root)
    expect(count(css, '--color-project:red')).toBe(2)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('a build keeps the globals of a local stylesheet on a page that loads no style entry', async () => {
  const root = fixture('shared-globals-pages-', 'import "./app.css";import "./a.css";')
  try {
    // A second page loads b.css alone: the entry of the first page never reaches it.
    writeFileSync(join(root, 'other.js'), 'import "./b.css";')
    writeFileSync(join(root, 'other.html'), '<script type="module" src="./other.js"></script>')
    const result = await build({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static' }), build: { write: false, cssMinify: false, rollupOptions: { input: [join(root, 'index.html'), join(root, 'other.html')] } } })
    if (Array.isArray(result) || 'on' in result) throw new Error('Expected one build output')
    const assets = result.output.filter(asset => asset.type === 'asset' && asset.fileName.endsWith('.css')).map(asset => asset.type === 'asset' ? String(asset.source) : '')
    const withB = assets.filter(css => /\.b\s*\{/.test(css))
    expect(withB).toHaveLength(1)
    expect(withB[0]).toContain('--color-project:red')
    const withA = assets.filter(css => /\.a\s*\{/.test(css))
    expect(withA).toHaveLength(1)
    expect(count(withA[0], '--color-project:red')).toBe(1)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('development leaves every local stylesheet its globals', async () => {
  const root = fixture('shared-globals-dev-', 'import "./app.css";import "./a.css";')
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static' }), server: { host: '127.0.0.1', port: 0, ws: false } })
    await server.listen()
    const css = async (file: string) => (await server!.transformRequest(`/${file}?direct`))?.code ?? ''
    await css('app.css')
    // The server cannot know every page that will load this stylesheet.
    expect(await css('a.css')).toContain('--color-project:red')
  } finally {
    await server?.close()
    rmSync(root, { recursive: true, force: true })
  }
})
