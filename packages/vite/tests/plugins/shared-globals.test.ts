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

test('an imported build input can also be loaded independently', async () => {
  const root = fixture('shared-globals-input-', 'import "./app.css";import "./standalone.js";')
  try {
    writeFileSync(join(root, 'standalone.js'), 'import "./a.css";')
    const result = await build({
      root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static' }),
      build: { write: false, cssMinify: false, rollupOptions: { input: [join(root, 'index.html'), join(root, 'standalone.js')] } }
    })
    if (Array.isArray(result) || 'on' in result) throw new Error('Expected one build output')
    const styles = result.output.filter(asset => asset.type === 'asset' && asset.fileName.endsWith('.css'))
      .map(asset => asset.type === 'asset' ? String(asset.source) : '')
    expect(styles.find(css => /\.a\s*\{/.test(css))).toContain('--color-project:red')
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

test('a declared global style entry carries the globals of siblings a build cannot connect to it', async () => {
  const root = fixture('shared-globals-declared-', 'const entry = () => import("./entry-styles.js"), section = () => import("./section.js");entry();section();')
  try {
    // A router loads the entry and each section lazily: nothing in the graph ties them together.
    writeFileSync(join(root, 'entry-styles.js'), 'import "./app.css";')
    writeFileSync(join(root, 'section.js'), 'import "./a.css";')
    const output = async (globalStyleEntry: boolean) => {
      const result = await build({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static', globalStyleEntry }), build: { write: false, cssMinify: false } })
      if (Array.isArray(result) || 'on' in result) throw new Error('Expected one build output')
      return result.output.filter(asset => asset.type === 'asset' && asset.fileName.endsWith('.css')).map(asset => asset.type === 'asset' ? String(asset.source) : '')
    }
    const proven = await output(false)
    expect(proven.find(css => /\.a\s*\{/.test(css))).toContain('--color-project:red')
    const declared = await output(true)
    expect(declared.find(css => /\.a\s*\{/.test(css))).not.toContain('--color-project:red')
    expect(count(declared.join('\n'), '--color-project:red')).toBe(1)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('a development server with a declared global style entry emits local globals there and refreshes it only for new ones', async () => {
  const root = fixture('shared-globals-dev-declared-', 'import "./a.css";import "./app.css";import "./b.css";')
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static', globalStyleEntry: true }), server: { host: '127.0.0.1', port: 0, ws: false } })
    await server.listen()
    const css = async (file: string) => (await server!.transformRequest(`/${file}?direct`))?.code ?? ''
    // Local stylesheets are often transformed before the entry that emits their globals.
    expect(await css('a.css')).not.toContain('--color-project:red')
    expect(await css('app.css')).toContain('--color-project:red')
    expect(await css('app.css')).not.toContain('--color-unused')
    expect(await css('b.css')).not.toContain('--color-project:red')
    expect(count(await css('app.css'), '--color-project:red')).toBe(1)
    expect(await css('own.css')).toContain('--color-own:green')
    expect(await css('own.css')).toContain('--color-project:red')
    // A local edit that needs no new global leaves the entry as it is.
    const entry = (await server.environments.client.moduleGraph.getModuleByUrl('/app.css?direct'))
    const transformed = entry?.transformResult
    expect(transformed).toBeTruthy()
    writeFileSync(join(root, 'b.css'), '@import "./shared.css";.b{background:var(--color-project);padding:1rem}')
    await expect.poll(() => css('b.css')).toContain('padding')
    await new Promise(resolve => setTimeout(resolve, 200))
    expect(entry?.transformResult).toBe(transformed)
    writeFileSync(join(root, 'b.css'), '@import "./shared.css";.b{background:var(--color-unused)}')
    await expect.poll(() => css('b.css')).toContain('--color-unused')
    expect(await css('b.css')).not.toContain('--color-unused:blue')
    await expect.poll(() => css('app.css')).toContain('--color-unused:blue')
  } finally {
    await server?.close()
    rmSync(root, { recursive: true, force: true })
  }
})
