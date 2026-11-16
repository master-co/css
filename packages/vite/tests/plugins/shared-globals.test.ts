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

test('development leaves local globals to the style entry and refreshes it only for new globals', async () => {
  const root = fixture('shared-globals-dev-', 'import "./a.css";import "./app.css";import "./b.css";')
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static' }), server: { host: '127.0.0.1', port: 0, ws: false } })
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
    const entry = server.environments.client.moduleGraph.getModuleById(join(root, 'app.css') + '?direct')
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

test('development returns local globals once the server settles without a style entry, until one is delivered', async () => {
  const root = fixture('shared-globals-dev-no-entry-', 'import "./a.css";')
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static' }), server: { host: '127.0.0.1', port: 0, ws: false } })
    await server.listen()
    const css = async (file: string) => (await server!.transformRequest(`/${file}?direct`))?.code ?? ''
    expect(await css('a.css')).not.toContain('--color-project:red')
    await expect.poll(() => css('a.css'), { timeout: 10_000 }).toContain('--color-project:red')
    expect(await css('app.css')).not.toContain('--color-project:red')
    await expect.poll(() => css('a.css')).not.toContain('--color-project:red')
    await expect.poll(() => css('app.css')).toContain('--color-project:red')
  } finally {
    await server?.close()
    rmSync(root, { recursive: true, force: true })
  }
})
